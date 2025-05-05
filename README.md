# ProyectoIDS
## Estructura (sugerida) repositorio
```bash
ProyectoIDS/
│
├── frontend/ # Aplicación React (Interfaz de usuario)
├── backend/ # Api y lógica del servidor
├── database/ # Configuración de Firebase
├── docs/ # Documentación técnica
├── README.md
└── .gitignore

```

## 🔁 Flujo de trabajo con Git

Trabajaremos con ramas por equipo:

- `main`: versión estable para producción (NO editar directamente).
- `develop`: integración de funcionalidades en desarrollo.
- `frontend/*`: funcionalidades del equipo frontend.
- `api/*`: funcionalidades del equipo backend/API.
- `database/*`: configuraciones y reglas de la base de datos

### Cómo contribuir



1. Clona el repositorio:
```bash
   git clone https://github.com/HugoosZ/ProyectoIDS.git
   cd ProyectoIDS
```

2. Actualizar el codigo:
```bash
   git pull
```

3. Crea tu rama 
```bash
   git checkout -b frontend/login-page
```
4. 
```bash
   git add .
   git commit -m "Agrega página de login"
   git push origin frontend/login-page

```
5. Crea un pull request hacia la rama develop

6. Una vez revisados y probados los cambios, se integran a main como versión final estable.






