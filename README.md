# ProyectoIDS
## Estructura (sugerida) repositorio
```bash
ProyectoIDS/
│
├── frontend/ # Aplicación React (Interfaz de usuario)
├── backend/ # Api y lógica del servidor
|── backend/          # API y lógica del servidor
│   ├── index.js
│   ├── app.js
│   ├── firebase.js
│   ├── .env
|   ├── package-lock-json
|   └── package.json
|   
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
2. Crea tu rama 
```bash
git checkout -b frontend/login-page
```
3. 
```bash
git add .
git commit -m "Agrega página de login"
git push origin frontend/login-page

```
4. Crea un pull request hacia la rama develop


