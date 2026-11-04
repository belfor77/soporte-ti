INVALID_SERIALS = {'DESCONOCIDO', 'UNKNOWN', 'DEFAULT STRING', 'TO BE FILLED BY O.E.M.',
                   'NONE', 'N/A', 'SYSTEM SERIAL NUMBER', 'NOT SPECIFIED', 'NO ASSET TAG'}

def valid_serial(value):
    s = str(value or '').strip().upper()
    return len(s) >= 3 and s not in INVALID_SERIALS and set(s) != {'0'}
