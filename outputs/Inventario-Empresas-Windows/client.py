import requests

URL = 'https://gabaztpewsauikxqcvnq.supabase.co'
KEY = 'sb_publishable_jYl2N_pEwJLJhW77Lvf7Jg_zcD5TcMB'

class Client:
    def __init__(self):
        self.token = None
    def call(self, path, payload):
        headers = {'apikey': KEY, 'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = 'Bearer ' + self.token
        try:
            r = requests.post(URL + path, json=payload, headers=headers, timeout=25)
        except requests.RequestException:
            raise ValueError('No se pudo conectar. Revisa internet y vuelve a intentar; el formulario se conserva.')
        if not r.ok:
            try:
                msg = r.json().get('message') or r.json().get('msg') or 'Acceso rechazado'
            except ValueError:
                msg = 'Respuesta inesperada del servidor'
            raise ValueError(msg)
        return r.json()
    def login(self, email, password):
        data = self.call('/auth/v1/token?grant_type=password', {'email': email, 'password': password})
        self.token = data['access_token']
    def inventory(self, serial, data=None, expected=None):
        return self.call('/rest/v1/rpc/desktop_inventory', {'p_serial': serial, 'p_data': data, 'p_expected': expected})
