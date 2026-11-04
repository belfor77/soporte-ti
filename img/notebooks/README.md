# Fotos de referencia de notebooks

Guardar las imágenes por marca, modelo y generación. Por ejemplo:

- `hp-elitebook-840-g3/arriba.jpg`
- `hp-elitebook-840-g3/abajo.jpg`

Después agregar la entrada correspondiente a `notebook-photos.js` (incluye un ejemplo).
Cada vista usa `label` e `image`; se aceptan fotos JPG, PNG o WebP locales dentro
de `img/notebooks/`. No basta con copiar archivos: deben quedar asociados al modelo
en el catálogo para evitar mostrar fotos de otra generación.

Las fotos locales tienen preferencia sobre las referencias del fabricante. Si no
hay foto local, se conserva la imagen externa ya asociada al modelo. El detalle
permite elegir entre las vistas disponibles y muestra un aviso si falla la carga.

Estas fotos son de referencia por modelo, no evidencia del estado físico de un
serial específico. Evitar datos personales o etiquetas legibles con información
sensible en las imágenes de referencia.
