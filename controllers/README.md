## CONTROLLERS

- Esta carpeta se utiliza para el almacenamiento de los archivos encargados del manejo de las respuestas al cliente, separandolas por componente.
- El controlador toma lo que necesita de Express (o cualquier marco que esté usando), realiza algunas comprobaciones / validaciones para averiguar a qué servicio (s) deben enviarse los datos de la solicitud y orquesta esas llamadas de servicio.
- Formato: camelCase, y el mismo nombre del componente