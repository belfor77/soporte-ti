"""Iconos vectoriales nativos: sin fuentes de símbolos ni descargas."""
import tkinter as tk

class Icon(tk.Canvas):
    def __init__(self, master, kind, color='#16858b', background='#e9f5f4', size=42):
        super().__init__(master, width=size, height=size, bg=background, highlightthickness=0)
        scale = size / 42
        def line(*points):
            self.create_line(*[p * scale for p in points], fill=color, width=2, capstyle='round', joinstyle='round')
        def rect(a,b,c,d):
            self.create_rectangle(a*scale,b*scale,c*scale,d*scale,outline=color,width=2)
        if kind == 'cpu':
            rect(13,13,29,29); rect(17,17,25,25)
            for n in (16,21,26):
                line(n,8,n,12);line(n,30,n,34);line(8,n,12,n);line(30,n,34,n)
        elif kind == 'ram':
            rect(7,14,35,28)
            for x in (11,19,27): rect(x,18,x+4,24)
            for x in range(11,34,4): line(x,29,x,32)
        elif kind == 'disk':
            rect(10,8,32,34)
            self.create_oval(15*scale,12*scale,27*scale,24*scale,outline=color,width=2)
            line(21,18,29,25);line(15,29,25,29)
        elif kind == 'windows':
            for a,b,c,d in ((9,10,19,20),(23,10,33,20),(9,24,19,34),(23,24,33,34)): rect(a,b,c,d)
        elif kind == 'network':
            rect(16,7,26,16);line(21,16,21,24);line(9,24,33,24)
            for x in (9,21,33): line(x,24,x,28);rect(x-4,28,x+4,35)
        elif kind == 'serial':
            for x in (9,12,17,19,24,29,33): line(x,11,x,30)
            line(9,34,33,34)
        else:
            rect(7,8,35,28);line(21,28,21,34);line(14,35,28,35)
