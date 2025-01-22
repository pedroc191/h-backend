# Algunas recomendaciones
    - Este es un proyecto template, revisa bien y adapta lo que sea necesario.
    - Configuraciones relacionadas el ejs pueden variar segun la plantilla que use.
    - Recomendamos mantener esta estructura por motivos de modularidad y futuro mantenimiento.
    - Dentro de cada carpeta hay un readme explicando un poco el contenido de cada una.
    - Leer READMEAPP.md
    - Los datos del usuario estan estáticos
    - Agregar .env al archivo .gitignore
    - Agregar al .gitignore cualquier otro archivo con datos delicados como credenciales
    - Para el envio emails es necesario el archivo transport.js con datos reales, requerido por nodemailer
    - Para cambiar los colores, ir a css/features y modificar el color en :root. Para agregar la clase de colores en el template, agregar la respectiva clase en el HTML, ej: primary-bg.

Lo siguiente es una estructura básica para un archivo README,
Solo debes personalizar la información adaptada al proyecto.

# Nombre del proyecto

Este proyecto sirve como una base para dar inicio a tu proyecto. Debe ser adaptado a las necesidades del proyecto que inicias.

## Para empezar 

```bash
git clone (url-repo)
```
En el directorio del proyecto
```bash
npm install
```
## Ejecutar

- En la raiz del proyecto puede ejecutar:
    - `node app.js`
    - `npm start`
    -  nodemon

**los dos últimos se basan en el script start del package.json**

**Nota**
    -  si deseas cambiar el inicio de tu proyecto, recuerda cambiar el script start en package.json, así ayudas a otros desarrolladores que deban trabajar en tu proyecto.
    - Nodemon es una dev dependency, no se usa en producción.

- Navigate to `http://localhost:${port}/`

## Pre-requisitos

Herramientas que son necesarias instalar en el computador para el adecuado funcionamiento del proyecto.

## Roadmap (Opcional)

Futuras versiones del proyecto
Puedes usar una tabla para ordenar este contenido


Version | Tipo | Desc
--- | --- | ---
Indica la version, puede ser la actual o futura | New / Improve | Descripcion
1 | 2 | 3

Ejemplo: 

Version | Tipo | Desc
--- | --- | ---
v1 | New | login,logout,signup resetpass, forgotpass


## Para contribuir

Lista de reglas que se aplican dentro del repositorio, por ejemplo los commits, las ramas.

Si desea colaborar con esta plantilla:
- cree su propia rama (dev-yourname)
- solicite MR (Merge request)

## Contribuidores ❤️

Lista de los usuarios desarrolladores que participan en el proyecto

- [@nathali2b](https://gitlab.com/nathali2b)
- [@jaissel2b](https://gitlab.com/jaissel2b)

