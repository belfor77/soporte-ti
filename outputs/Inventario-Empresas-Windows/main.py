import sys
import threading
from pathlib import Path
from tkinter import messagebox
import customtkinter as ctk
from PIL import Image
from client import Client
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
        self.images = {}
        header = ctk.CTkFrame(self, fg_color='#142b46', corner_radius=0)
        header.pack(fill='x')
        ctk.CTkLabel(header, text='Inventario de equipos', font=('Segoe UI', 27, 'bold'), text_color='white').pack(anchor='w', padx=28, pady=(20, 2))
        ctk.CTkLabel(header, text='1  Conectar     →     2  Detectar y asignar     →     3  Confirmar', text_color='#c6d7e8').pack(anchor='w', padx=28, pady=(0, 20))
        body = ctk.CTkScrollableFrame(self, fg_color='transparent')
        body.pack(fill='both', expand=True, padx=20, pady=12)
        login = self.card(body, 'Acceso de soporte')
        self.email = self.entry(login, 'Correo de soporte')
        self.password = self.entry(login, 'Contraseña', show='•')
        self.login_button = ctk.CTkButton(login, text='Conectar', command=self.login)
        self.login_button.pack(anchor='e', padx=16, pady=12)
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
        self.summary = ctk.CTkLabel(pc, text='Conecta tu cuenta y detecta el equipo para comenzar.', justify='left', wraplength=820)
        self.summary.pack(anchor='w', padx=16, pady=8)
        self.name = self.entry(pc, 'Nombre y apellido')
        self.user_email = self.entry(pc, 'Correo electrónico')
        self.kind = ctk.CTkOptionMenu(pc, values=['laptop', 'escritorio', 'servidor'])
        self.kind.pack(anchor='w', padx=16, pady=8)
        self.save_button = ctk.CTkButton(pc, text='Confirmar y sincronizar', command=self.save, state='disabled', height=44)
        self.save_button.pack(fill='x', padx=16, pady=16)
        self.status = ctk.CTkLabel(body, text='Sin conexión', wraplength=850)
        self.status.pack(pady=10)
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
        for b in (self.login_button, self.detect_button, self.save_button):
            b.configure(state='disabled')
        def worker():
            try:
                result = work()
                self.after(0, lambda: finish(result, None))
            except Exception as exc:
                self.after(0, lambda error=str(exc): finish(None, error))
        def finish(result, error):
            self.busy = False
            self.login_button.configure(state='normal')
            self.detect_button.configure(state='normal')
            self.save_button.configure(state='normal' if self.hardware else 'disabled')
            if error:
                self.status.configure(text='No se completó la operación')
                messagebox.showerror('Inventario', error)
            else:
                done(result)
        threading.Thread(target=worker, daemon=True).start()
    def login(self):
        email, password = self.email.get().strip(), self.password.get()
        def done(_):
            self.password.delete(0, 'end')
            self.status.configure(text='Cuenta conectada. Detecta el equipo para comprobar los permisos de inventario.')
        self.run_task(lambda: self.client.login(email, password), done)
    def detect(self):
        if not self.client.token:
            return messagebox.showinfo('Acceso', 'Conecta primero tu cuenta de soporte.')
        self.hardware = None
        def work():
            data = extraer_toda_la_informacion()
            return data, self.client.inventory(data['numero_serie'])
        def done(result):
            self.hardware, self.existing = result
            h, old = result
            previous = ('Asignado actualmente a: ' + (old.get('usuario_nombre') or 'Sin responsable') + ' · ' + (old.get('empresa') or 'Sin empresa')) if old else 'Equipo nuevo: se registrará en el inventario.'
            self.summary.configure(text=f"{h['equipo']} · {h['marca']} {h['modelo']}\nSerie: {h['numero_serie']}\n{h['procesador']}\nRAM: {h['ram']} · {h['windows']}\n{previous}")
            if old:
                for entry, key in ((self.name, 'usuario_nombre'), (self.user_email, 'usuario_email')):
                    entry.delete(0, 'end')
                    entry.insert(0, old.get(key) or '')
                if old.get('empresa') in COMPANIES:
                    self.company.set(old['empresa'])
                    self.brand(old['empresa'])
            self.save_button.configure(state='normal', text='Actualizar equipo / asignación' if old else 'Registrar nuevo PC')
            self.status.configure(text='Consulta completada. Revisa la empresa y el responsable antes de guardar.')
        self.run_task(work, done)
    def save(self):
        if not self.hardware or self.busy:
            return
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
