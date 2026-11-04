import sys
import threading
from pathlib import Path
from tkinter import messagebox
import customtkinter as ctk
from PIL import Image
from client import Client
from identity import valid_serial
from hardware import extraer_toda_la_informacion
from utils import validar_correo

ctk.set_appearance_mode('light')
ctk.set_default_color_theme('blue')
ASSETS = Path(getattr(sys, '_MEIPASS', Path(__file__).parent)) / 'assets'
COMPANIES = {'T-Sales': ('tsales', '#238f94'), 'VPrime': ('vprime', '#c62828'), 'Infinet': ('infinet', '#e88600')}

class App(ctk.CTk):
    def __init__(self):
        super().__init__()
        self.title('Inventario · Soporte TI')
        self.geometry('1020x820')
        self.minsize(900, 700)
        self.configure(fg_color='#eef2f6')
        self.client = Client()
        self.hardware = None
        self.existing = None
        self.busy = False
        self.queried_serial = None
        self.images = {}
        header = ctk.CTkFrame(self, fg_color='#142b46', corner_radius=0)
        header.pack(fill='x')
        ctk.CTkLabel(header, text='Inventario de equipos', font=('Segoe UI', 27, 'bold'), text_color='white').pack(anchor='w', padx=28, pady=(20, 2))
        ctk.CTkLabel(header, text='1  Detectar equipo     →     2  Completar datos     →     3  Guardar', text_color='#c6d7e8').pack(anchor='w', padx=28, pady=(0, 20))
        body = ctk.CTkScrollableFrame(self, fg_color='transparent')
        body.pack(fill='both', expand=True, padx=20, pady=12)
        company = self.card(body, 'Empresa del equipo')
        self.company = ctk.CTkSegmentedButton(company, values=list(COMPANIES), command=self.brand)
        self.company.pack(fill='x', padx=16, pady=10)
        self.logo = ctk.CTkLabel(company, text='')
        self.logo.pack(pady=6)
        self.company.set('T-Sales')
        self.brand('T-Sales')
        pc = self.card(body, 'Equipo y asignación')
        self.detect_button = ctk.CTkButton(pc, text='Detectar equipo y consultar inventario', command=self.detect)
        self.detect_button.pack(fill='x', padx=16, pady=12)
        self.summary = ctk.CTkLabel(pc, text='Detectando los datos del equipo…', justify='left', wraplength=820)
        self.summary.pack(anchor='w', padx=16, pady=8)
        ctk.CTkLabel(pc, text='Serie del equipo (si falta, copia la serie de la etiqueta física)').pack(anchor='w', padx=16)
        self.serial = self.entry(pc, 'Número de serie')
        self.serial.bind('<KeyRelease>', self.serial_changed)
        self.lookup_button = ctk.CTkButton(pc, text='Consultar serie corregida', command=self.lookup)
        self.lookup_button.pack(anchor='w', padx=16, pady=8)
        ctk.CTkLabel(pc, text='Nombre y apellido').pack(anchor='w', padx=16)
        self.name = self.entry(pc, 'Nombre y apellido')
        self.user_email = self.entry(pc, 'Correo electrónico')
        self.kind = ctk.CTkOptionMenu(pc, values=['laptop', 'escritorio', 'servidor'])
        self.kind.pack(anchor='w', padx=16, pady=8)
        self.save_button = ctk.CTkButton(pc, text='Confirmar y sincronizar', command=self.save, state='disabled', height=44)
        self.save_button.pack(fill='x', padx=16, pady=16)
        self.status = ctk.CTkLabel(body, text='Preparando inventario…', wraplength=850)
        self.status.pack(pady=10)
        self.after(300, self.detect)
    def card(self, parent, title):
        frame = ctk.CTkFrame(parent, fg_color='white', corner_radius=14)
        frame.pack(fill='x', pady=8)
        ctk.CTkLabel(frame, text=title, font=('Segoe UI', 17, 'bold')).pack(anchor='w', padx=16, pady=(12, 4))
        return frame
    def entry(self, parent, placeholder, **kwargs):
        item = ctk.CTkEntry(parent, placeholder_text=placeholder, height=38, **kwargs)
        item.pack(fill='x', padx=16, pady=5)
        return item
    def brand(self, company):
        file, color = COMPANIES[company]
        if company not in self.images:
            img = Image.open(ASSETS / (file + '.png'))
            self.images[company] = ctk.CTkImage(img, size=(170, int(170 * img.height / img.width)))
        self.logo.configure(image=self.images[company])
    def run_task(self, work, done):
        if self.busy:
            return
        self.busy = True
        self.status.configure(text='Procesando…')
        for b in (self.lookup_button, self.detect_button, self.save_button):
            b.configure(state='disabled')
        def worker():
            try:
                result = work()
                self.after(0, lambda: finish(result, None))
            except Exception as exc:
                self.after(0, lambda error=str(exc): finish(None, error))
        def finish(result, error):
            self.busy = False
            self.lookup_button.configure(state='normal')
            self.detect_button.configure(state='normal')
            self.save_button.configure(state='normal' if self.queried_serial else 'disabled')
            if error:
                self.status.configure(text='No se completó la operación')
                messagebox.showerror('Inventario', error)
            else:
                done(result)
        threading.Thread(target=worker, daemon=True).start()
    def serial_changed(self, _event=None):
        if self.serial.get().strip().upper() != self.queried_serial:
            self.queried_serial = None
            self.existing = None
            self.save_button.configure(state='disabled')

    def detect(self):
        if self.busy:
            return
        self.hardware = None
        self.queried_serial = None
        self.existing = None
        def work():
            # WMI uses COM, which must be initialized in this background thread.
            com = None
            if sys.platform == 'win32':
                import pythoncom
                pythoncom.CoInitialize()
                com = pythoncom
            try:
                return extraer_toda_la_informacion()
            finally:
                if com:
                    com.CoUninitialize()
        def done(data):
            self.hardware = data
            self.serial.delete(0, 'end')
            if valid_serial(data['numero_serie']):
                self.serial.insert(0, data['numero_serie'])
            self.summary.configure(text=f"{data['equipo']} · {data['marca']} {data['modelo']}\n{data['procesador']}\nRAM: {data['ram']} · {data['windows']}")
            if valid_serial(data['numero_serie']):
                self.lookup()
            else:
                self.status.configure(text='Windows no entregó una serie válida. Copia la serie de la etiqueta del PC y pulsa Consultar serie corregida.')
        self.run_task(work, done)

    def lookup(self):
        if not self.hardware or self.busy:
            return
        serial = self.serial.get().strip().upper()
        if not valid_serial(serial):
            return messagebox.showinfo('Serie del equipo', 'Ingresa la serie real de la etiqueta del PC. No uses una serie inventada.')
        self.queried_serial = None
        self.existing = None
        def done(old):
            # A lookup for a previous value must never authorize the edited value.
            if self.serial.get().strip().upper() != serial:
                self.status.configure(text='La serie cambió. Consulta de nuevo antes de guardar.')
                return
            self.hardware['numero_serie'] = serial
            self.queried_serial = serial
            self.existing = old
            previous = ('Responsable actual: ' + (old.get('usuario_nombre') or 'Sin responsable') + ' · ' + (old.get('empresa') or 'Sin empresa')) if old else 'Equipo nuevo: listo para registrar.'
            self.summary.configure(text=f"{self.hardware['equipo']} · Serie: {serial}\n{previous}")
            self.save_button.configure(state='normal', text='Actualizar equipo / asignación' if old else 'Registrar nuevo PC')
            self.status.configure(text='Consulta completada. Completa nombre, apellido y correo; revisa la empresa y guarda.')
        self.run_task(lambda: self.client.inventory(serial), done)

    def save(self):
        if not self.hardware or self.busy:
            return
        if self.serial.get().strip().upper() != self.queried_serial:
            return messagebox.showinfo('Consultar equipo', 'Consulta la serie antes de guardar.')
        name, email = self.name.get().strip(), self.user_email.get().strip()
        if not name or not validar_correo(email):
            return messagebox.showerror('Datos incompletos', 'Ingresa el nombre y un correo válido del responsable.')
        h = self.hardware
        payload = dict(nombre_codigo=h['equipo'], marca=h['marca'], modelo=h['modelo'], serial=h['numero_serie'], cpu=h['procesador'], ram=h['ram'], disco_duro=h['almacenamiento'], sistema_operativo=h['windows'], empresa=self.company.get(), usuario_nombre=name, usuario_email=email, tipo=self.kind.get())
        old = self.existing
        text = f"Empresa: {payload['empresa']}\nEquipo: {h['equipo']}\nSerie: {h['numero_serie']}\nResponsable: {name} ({email})"
        if old:
            text += '\nResponsable anterior: ' + (old.get('usuario_nombre') or 'Sin responsable')
        if not messagebox.askyesno('Confirmar sincronización', text):
            return
        def done(result):
            self.existing = result
            self.status.configure(text='Guardado en la base de datos. Actualiza el inventario de la web para verlo.')
            messagebox.showinfo('Sincronizado', 'El equipo se guardó correctamente en el inventario compartido.')
        self.run_task(lambda: self.client.inventory(h['numero_serie'], payload, old), done)

if __name__ == '__main__':
    App().mainloop()
