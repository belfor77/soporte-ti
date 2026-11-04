import queue
import sys
import threading
from pathlib import Path
from tkinter import messagebox
import customtkinter as ctk
from PIL import Image
from client import Client
from hardware import extraer_toda_la_informacion
from identity import valid_serial
from icons import Icon
from locations import COMPANIES, OFFICES, TYPES
from utils import validar_correo

ctk.set_appearance_mode('light')
ctk.set_default_color_theme('blue')
ASSETS = Path(getattr(sys, '_MEIPASS', Path(__file__).parent)) / 'assets'
INK, MUTED, BG, ACCENT = '#172b43', '#61758b', '#eef3f8', '#16858b'

class App(ctk.CTk):
    def __init__(self):
        super().__init__()
        self.title('Inventario de equipos · Soporte TI')
        sw, sh = self.winfo_screenwidth(), self.winfo_screenheight()
        self.geometry(f'{min(1220, sw-60)}x{min(860, sh-80)}')
        self.minsize(920, 640)
        self.configure(fg_color=BG)
        self.client = Client()
        self.hardware = None
        self.existing = None
        self.queried_serial = None
        self.busy = False
        self.events = queue.Queue()
        self.images = {}
        self.details_visible = False
        self.fields = {}
        self.company_value = ctk.StringVar(value='T-Sales')
        self.site_value = ctk.StringVar(value='')
        self._build()
        self.brand('T-Sales')
        self.after(100, self.poll)
        self.after(350, self.detect)

    def label(self, parent, text, size=13, color=INK, bold=False, **kw):
        return ctk.CTkLabel(parent, text=text, text_color=color,
                           font=('Segoe UI', size, 'bold' if bold else 'normal'), **kw)

    def panel(self, parent, title, subtitle):
        frame = ctk.CTkFrame(parent, fg_color='white', corner_radius=16)
        self.label(frame, title, 18, bold=True).pack(anchor='w', padx=20, pady=(16, 0))
        self.label(frame, subtitle, 12, MUTED).pack(anchor='w', padx=20, pady=(0, 10))
        return frame

    def input(self, parent, title, placeholder):
        self.label(parent, title, 12, bold=True).pack(anchor='w', padx=20, pady=(12, 4))
        widget = ctk.CTkEntry(parent, placeholder_text=placeholder, height=40,
                             border_color='#d8e1eb', fg_color='#f8fafc', text_color=INK)
        widget.pack(fill='x', padx=20)
        return widget

    def _build(self):
        header = ctk.CTkFrame(self, fg_color='#11283f', corner_radius=0)
        header.pack(fill='x')
        self.label(header, 'SOPORTE TI  /  INVENTARIO', 11, '#96b6ce', True).pack(anchor='w', padx=26, pady=(14, 0))
        self.label(header, 'Conoce tu equipo. Registra su asignación.', 24, 'white', True).pack(anchor='w', padx=26, pady=(0, 3))
        self.label(header, '01  Empresa y sede     /     02  Nombre y apellido     /     03  Revisar y guardar', 12, '#c4d7e6').pack(anchor='w', padx=26, pady=(0, 14))
        # Fixed footer keeps progress and the primary action visible on laptop screens.
        footer = ctk.CTkFrame(self, fg_color='white', corner_radius=0)
        footer.pack(side='bottom', fill='x')
        self.save_button = ctk.CTkButton(footer, text='Esperando detección…', width=230, height=43,
                                       fg_color=ACCENT, hover_color='#11696e', command=self.save, state='disabled')
        self.save_button.pack(side='right', padx=24, pady=14)
        status_box = ctk.CTkFrame(footer, fg_color='transparent')
        status_box.pack(side='left', fill='both', expand=True, padx=26, pady=8)
        self.status = self.label(status_box, 'Preparando detección automática…', 12, MUTED, wraplength=590, justify='left')
        self.status.pack(anchor='w')
        self.progress = ctk.CTkProgressBar(status_box, height=4, fg_color='#e3eaf1', progress_color=ACCENT)
        self.progress.pack(fill='x', pady=(5, 0))
        self.progress.set(0)
        body = ctk.CTkFrame(self, fg_color='transparent')
        body.pack(fill='both', expand=True, padx=20, pady=16)
        body.grid_columnconfigure(0, weight=0, minsize=340)
        body.grid_columnconfigure(1, weight=1)
        body.grid_rowconfigure(0, weight=1)
        left = ctk.CTkScrollableFrame(body, fg_color='transparent', width=330)
        left.grid(row=0, column=0, sticky='nsew', padx=(0, 12))
        right = ctk.CTkScrollableFrame(body, fg_color='transparent')
        right.grid(row=0, column=1, sticky='nsew')
        company = self.panel(left, '01  Empresa y sede', 'Selecciona dónde está asignado el PC.')
        company.pack(fill='x', pady=(0, 12))
        self.company_buttons = {}
        for name, (file, color) in COMPANIES.items():
            image = Image.open(ASSETS / (file + '.png'))
            # Display the supplied logo compactly without changing the original asset.
            self.images[name] = ctk.CTkImage(image, size=(60, int(60 * image.height / image.width)))
            button = ctk.CTkButton(company, text='  '+name, image=self.images[name], compound='left', anchor='w',
                                  height=52, fg_color='#f7f9fc', hover_color='#eaf0f6', text_color=INK,
                                  border_width=1, border_color='#e1e8ef', command=lambda n=name: self.brand(n))
            button.pack(fill='x', padx=20, pady=3)
            self.company_buttons[name] = button
        self.label(company, 'Sede', 12, bold=True).pack(anchor='w', padx=20, pady=(12, 4))
        self.site = ctk.CTkOptionMenu(company, variable=self.site_value, values=['Selecciona una sede'],
                                     command=self.site_changed, height=38, fg_color='#eaf1f6',
                                     button_color='#dbe7ef', button_hover_color='#cbdce8', text_color=INK)
        self.site.pack(fill='x', padx=20)
        self.address = self.label(company, '', 12, MUTED, wraplength=270, justify='left')
        self.address.pack(anchor='w', padx=20, pady=(6, 16))
        person = self.panel(left, '02  Datos de la persona', 'Completa los datos del responsable.')
        person.pack(fill='x', pady=(0, 10))
        self.name = self.input(person, 'Nombre y apellido', 'Ej.: María González')
        self.user_email = self.input(person, 'Correo electrónico', 'nombre@empresa.cl')
        self.label(person, 'Tipo de equipo', 12, bold=True).pack(anchor='w', padx=20, pady=(12, 4))
        self.kind = ctk.CTkOptionMenu(person, values=list(TYPES), height=38, fg_color='#eaf1f6',
                                     button_color='#dbe7ef', text_color=INK)
        self.kind.pack(fill='x', padx=20, pady=(0, 18))
        hero = self.panel(right, 'Ficha del equipo', 'Los datos se obtienen automáticamente de este PC.')
        hero.pack(fill='x', pady=(0, 12))
        title_row = ctk.CTkFrame(hero, fg_color='transparent')
        title_row.pack(fill='x', padx=20, pady=(0, 14))
        Icon(title_row, 'pc', size=54).pack(side='left', padx=(0, 14))
        titles = ctk.CTkFrame(title_row, fg_color='transparent')
        titles.pack(side='left', fill='x', expand=True)
        self.pc_name = self.label(titles, 'Detectando equipo…', 21, bold=True)
        self.pc_name.pack(anchor='w')
        self.pc_model = self.label(titles, 'Marca y modelo pendientes', 12, MUTED, wraplength=430, justify='left')
        self.pc_model.pack(anchor='w')
        self.assignment = ctk.CTkFrame(right, fg_color='#e7eff8', corner_radius=12)
        self.assignment.pack(fill='x', pady=(0, 12))
        self.assignment_title = self.label(self.assignment, 'CONSULTA DEL INVENTARIO PENDIENTE', 11, '#315577', True)
        self.assignment_title.pack(anchor='w', padx=16, pady=(10, 0))
        self.assignment_text = self.label(self.assignment, 'La asignación actual aparecerá aquí.', 13, INK, wraplength=540, justify='left')
        self.assignment_text.pack(anchor='w', padx=16, pady=(0, 10))
        tiles = ctk.CTkFrame(right, fg_color='transparent')
        tiles.pack(fill='x')
        for col in range(2): tiles.grid_columnconfigure(col, weight=1, uniform='specs')
        for i, (key, title, icon) in enumerate([
            ('procesador','PROCESADOR','cpu'), ('ram','MEMORIA RAM','ram'),
            ('almacenamiento','ALMACENAMIENTO','disk'), ('windows','WINDOWS','windows'),
            ('red','CONEXIÓN DE RED','network'), ('numero_serie','NÚMERO DE SERIE','serial')]):
            tile = ctk.CTkFrame(tiles, fg_color='white', corner_radius=14)
            tile.grid(row=i//2, column=i%2, sticky='nsew', padx=(0, 6) if i%2==0 else (6, 0), pady=(0, 12))
            Icon(tile, icon).pack(anchor='w', padx=16, pady=(14, 6))
            self.label(tile, title, 10, MUTED, True).pack(anchor='w', padx=16)
            value = self.label(tile, 'Detectando…', 14, bold=True, wraplength=230, justify='left', anchor='w')
            value.pack(fill='x', padx=16, pady=(3, 14))
            self.fields[key] = value
            tile.bind('<Configure>', lambda event, widget=value: widget.configure(wraplength=max(140, event.width-32)))
        tools = self.panel(right, 'Información técnica', 'Detalles de Windows, red y hardware recopilados.')
        tools.pack(fill='x', pady=(0, 12))
        self.details_button = ctk.CTkButton(tools, text='Mostrar toda la información', command=self.toggle_details,
                                          fg_color='#eaf1f6', text_color=INK, hover_color='#dce8f0', height=34)
        self.details_button.pack(fill='x', padx=20, pady=(0, 12))
        self.details = ctk.CTkTextbox(tools, height=270, fg_color='#f5f8fb', text_color=INK, font=('Segoe UI', 12), wrap='word')
        self.detect_button = ctk.CTkButton(tools, text='Volver a detectar el PC', command=self.detect,
                                         fg_color='transparent', text_color=ACCENT, border_width=1, border_color='#d5e2eb')
        self.detect_button.pack(fill='x', padx=20, pady=(0, 12))
        self.serial_panel = self.panel(right, 'Corregir número de serie', 'Solo si la detección no coincide con la etiqueta del PC.')
        self.serial_panel.pack(fill='x', pady=(0, 12))
        self.serial = ctk.CTkEntry(self.serial_panel, placeholder_text='Serie de la etiqueta física', height=38)
        self.serial.pack(fill='x', padx=20)
        self.serial.bind('<KeyRelease>', self.serial_changed)
        self.lookup_button = ctk.CTkButton(self.serial_panel, text='Consultar esta serie', command=self.lookup,
                                          fg_color='#eaf1f6', text_color=INK, hover_color='#dce8f0')
        self.lookup_button.pack(fill='x', padx=20, pady=12)

    def brand(self, company):
        previous = self.company_value.get()
        self.company_value.set(company)
        for name, button in self.company_buttons.items():
            color = COMPANIES[name][1]
            button.configure(border_color=color if name==company else '#e1e8ef', border_width=2 if name==company else 1)
        selected = self.site_value.get() if previous == company else ''
        self.site.configure(values=['Selecciona una sede'] + list(OFFICES[company]))
        self.site_value.set(selected if selected in OFFICES[company] else 'Selecciona una sede')
        self.site_changed(self.site_value.get())
        color = COMPANIES[company][1]
        self.save_button.configure(fg_color=color)
        self.progress.configure(progress_color=color)

    def site_changed(self, name):
        self.address.configure(text=OFFICES[self.company_value.get()].get(name, 'Elige la sede donde está el equipo.'))

    def toggle_details(self):
        self.details_visible = not self.details_visible
        if self.details_visible:
            self.details.pack(fill='x', padx=20, pady=(0, 12))
        else:
            self.details.pack_forget()
        self.details_button.configure(text='Ocultar información técnica' if self.details_visible else 'Mostrar toda la información')

    def render_hardware(self, data):
        self.pc_name.configure(text=data.get('equipo', 'Detectando equipo…'))
        self.pc_model.configure(text=' '.join(str(data.get(k,'')) for k in ('marca','modelo')).strip() or 'Marca y modelo pendientes')
        for key, widget in self.fields.items():
            if key in data:
                widget.configure(text=data[key])
            elif key == 'red' and 'ip' in data:
                widget.configure(text=f"IP: {data['ip']}\nMAC: {data.get('mac','Pendiente')}")
        names = {'equipo':'Nombre del PC','marca':'Marca','modelo':'Modelo','numero_serie':'Número de serie',
                 'procesador':'Procesador','ram':'Memoria RAM','almacenamiento':'Almacenamiento',
                 'windows':'Windows','estado':'Estado del equipo','usuario_windows':'Cuenta de Windows',
                 'dominio':'Dominio','ip':'Dirección IP','mac':'Dirección MAC','build_windows':'Build de Windows',
                 'arquitectura':'Arquitectura','fecha':'Fecha de detección'}
        self.details.configure(state='normal')
        self.details.delete('1.0', 'end')
        self.details.insert('end', '\n\n'.join(f'{names.get(k,k)}: {v}' for k,v in data.items()))
        self.details.configure(state='disabled')

    def sync_buttons(self):
        self.detect_button.configure(state='disabled' if self.busy else 'normal')
        self.lookup_button.configure(state='disabled' if self.busy or not self.hardware else 'normal')
        self.save_button.configure(state='normal' if not self.busy and self.queried_serial else 'disabled')

    def poll(self):
        try:
            while True:
                kind, value = self.events.get_nowait()
                if kind == 'progress':
                    text, fraction, partial = value
                    self.status.configure(text=text)
                    self.progress.set(fraction)
                    if partial: self.render_hardware(partial)
                else:
                    self.busy = False
                    self.sync_buttons()
                    if kind == 'error':
                        self.status.configure(text='No se completó la operación. Puedes volver a intentar.')
                        messagebox.showerror('Inventario', value)
                    else:
                        callback, result = value
                        callback(result)
        except queue.Empty:
            pass
        self.after(80, self.poll)

    def run_task(self, work, done, text):
        if self.busy: return
        self.busy = True
        self.status.configure(text=text)
        self.sync_buttons()
        def worker():
            try:
                result = work()
                self.events.put(('done', (done, result)))
            except Exception as exc:
                self.events.put(('error', str(exc)))
        threading.Thread(target=worker, daemon=True).start()

    def serial_changed(self, _event=None):
        if self.serial.get().strip().upper() != self.queried_serial:
            self.queried_serial = None
            self.existing = None
            self.assignment_title.configure(text='CONSULTA NECESARIA')
            self.assignment_text.configure(text='La serie cambió. Pulsa Consultar esta serie antes de guardar.')
            self.sync_buttons()

    def detect(self):
        if self.busy: return
        self.hardware = None
        self.queried_serial = None
        self.existing = None
        self.progress.set(0)
        self.save_button.configure(text='Detectando equipo…')
        for widget in self.fields.values(): widget.configure(text='Detectando…')
        self.assignment_title.configure(text='DETECTANDO EL EQUIPO')
        self.assignment_text.configure(text='Puedes completar empresa, sede y tus datos mientras esperamos.')
        def work():
            com = None
            if sys.platform == 'win32':
                import pythoncom
                pythoncom.CoInitialize()
                com = pythoncom
            try:
                return extraer_toda_la_informacion(lambda text, fraction, partial: self.events.put(('progress',(text,fraction,partial))))
            finally:
                if com: com.CoUninitialize()
        def done(data):
            self.hardware = data
            self.render_hardware(data)
            self.serial.delete(0, 'end')
            if valid_serial(data['numero_serie']):
                self.serial.insert(0, data['numero_serie'])
                self.lookup()
            else:
                self.fields['numero_serie'].configure(text='Serie no disponible')
                self.assignment_title.configure(text='REVISA LA ETIQUETA DEL PC')
                self.assignment_text.configure(text='Windows no entregó una serie válida. Escríbela en Corregir número de serie y consulta.')
                self.status.configure(text='Detección terminada. Falta consultar una serie válida.')
                self.progress.set(0.85)
                self.save_button.configure(text='Falta la serie del equipo')
            self.sync_buttons()
        self.run_task(work, done, 'Detectando hardware. Puedes completar tus datos mientras tanto…')

    def lookup(self):
        if not self.hardware or self.busy: return
        serial = self.serial.get().strip().upper()
        if not valid_serial(serial):
            return messagebox.showinfo('Serie del equipo', 'Ingresa la serie real de la etiqueta del PC.')
        self.queried_serial = None
        self.existing = None
        self.assignment_title.configure(text='CONSULTANDO INVENTARIO')
        self.assignment_text.configure(text='Buscando si este PC ya tiene un responsable…')
        def done(old):
            if self.serial.get().strip().upper() != serial:
                self.serial_changed()
                return
            self.hardware['numero_serie'] = serial
            self.fields['numero_serie'].configure(text=serial)
            self.queried_serial = serial
            self.existing = old
            if old:
                self.assignment.configure(fg_color='#fff3df')
                self.assignment_title.configure(text='EQUIPO YA REGISTRADO', text_color='#935e11')
                self.assignment_text.configure(text=f"Responsable actual: {old.get('usuario_nombre') or 'Sin responsable'}\n{old.get('empresa') or ''} · {old.get('sede') or 'Sede sin registrar'}")
                reverse = {v:k for k,v in TYPES.items()}
                if old.get('tipo') in reverse: self.kind.set(reverse[old['tipo']])
            else:
                self.assignment.configure(fg_color='#e8f5ef')
                self.assignment_title.configure(text='EQUIPO NUEVO', text_color='#23714c')
                self.assignment_text.configure(text='Este PC aún no está registrado. Completa tus datos para incorporarlo.')
            self.save_button.configure(text='Revisar y actualizar' if old else 'Revisar y registrar PC')
            self.status.configure(text='Equipo listo. Revisa empresa y sede, completa tus datos y guarda.')
            self.progress.set(1)
            self.sync_buttons()
        self.run_task(lambda: self.client.inventory(serial), done, 'Hardware detectado. Consultando asignación en la web…')

    def save(self):
        if not self.hardware or self.busy: return
        if self.serial.get().strip().upper() != self.queried_serial:
            return messagebox.showinfo('Consultar equipo', 'Consulta la serie antes de guardar.')
        company = self.company_value.get()
        sede = OFFICES[company].get(self.site_value.get())
        if not sede:
            return messagebox.showinfo('Selecciona la sede', 'Elige la sede donde está asignado este equipo.')
        name, email = self.name.get().strip(), self.user_email.get().strip()
        if not name or not validar_correo(email):
            return messagebox.showinfo('Completa tus datos', 'Ingresa Nombre y apellido y un correo electrónico válido.')
        h = self.hardware
        payload = dict(nombre_codigo=h['equipo'],marca=h['marca'],modelo=h['modelo'],serial=self.queried_serial,
                       cpu=h['procesador'],ram=h['ram'],disco_duro=h['almacenamiento'],sistema_operativo=h['windows'],
                       empresa=company,sede=sede,usuario_nombre=name,usuario_email=email,tipo=TYPES[self.kind.get()])
        old = self.existing
        text = f"Empresa: {company}\nSede: {sede}\nEquipo: {h['equipo']}\nSerie: {self.queried_serial}\nNombre y apellido: {name}\nCorreo: {email}"
        if old: text += '\n\nResponsable anterior: ' + (old.get('usuario_nombre') or 'Sin responsable')
        if not messagebox.askyesno('Revisar y guardar en inventario', text): return
        serial = self.queried_serial
        def done(result):
            if self.serial.get().strip().upper() == serial:
                self.existing = result
                self.save_button.configure(text='Revisar y actualizar')
            else:
                self.serial_changed()
            self.assignment.configure(fg_color='#e8f5ef')
            self.assignment_title.configure(text='GUARDADO EN EL INVENTARIO', text_color='#23714c')
            self.assignment_text.configure(text=f'{name}\n{company} · {sede}')
            self.status.configure(text='Guardado correctamente. Actualiza el inventario de la web para verlo.')
            messagebox.showinfo('Equipo sincronizado', 'Los datos del equipo, responsable, empresa y sede se guardaron correctamente.')
        self.run_task(lambda: self.client.inventory(serial,payload,old), done, 'Guardando equipo y sede en el inventario…')

if __name__ == '__main__':
    App().mainloop()
