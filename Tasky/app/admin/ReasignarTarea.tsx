import React, { useEffect, useState } from 'react';
import { View, Text, Alert, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import globalStyles from '../globalStyles';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Definimos un tipo para la tarea para mayor claridad y seguridad de tipo
type Tarea = {
    id: string;
    title: string;
    assignedTo: string | null | undefined; // Puede ser string, null o undefined
    status: string;
    // Puedes agregar otras propiedades si las usas, por ejemplo:
    // description: string;
    // startTime: { _seconds: number };
    // endTime: { _seconds: number };
};

// Definimos un tipo para el usuario
type Usuario = {
    uid: string;
    displayName?: string;
    email?: string;
    name?: string;
    lastName?: string;
};

export default function ReasignarTarea() {
    const router = useRouter();

    const [userData, setUserData] = useState<Usuario | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [tareas, setTareas] = useState<Tarea[]>([]); // Array para almacenar todas las tareas
    const [selectedTaskId, setSelectedTaskId] = useState('');

    const [allUsers, setAllUsers] = useState<Usuario[]>([]);
    const [availableUsers, setAvailableUsers] = useState<Usuario[]>([]);
    const [newAssignedToUser, setNewAssignedToUser] = useState('');

    useEffect(() => {
        if (!router.isReady) {
            return;
        }

        const init = async () => {
            const token = await AsyncStorage.getItem('userToken');

            if (!token) {
                Alert.alert('Error', 'No se encontró el token. Inicia sesión nuevamente.');
                router.push('/');
                return;
            }

            try {
                // Fetch del usuario actual
                const currentUserRes = await fetch('https://proyecto-ids.vercel.app/api/users', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!currentUserRes.ok) {
                    const errorBody = await currentUserRes.json();
                    console.error("Error al obtener datos de usuario - Estado HTTP:", currentUserRes.status, "Cuerpo:", errorBody);
                    throw new Error(`Error al cargar datos del usuario: ${errorBody.message || currentUserRes.statusText}`);
                }
                const currentUser: Usuario = await currentUserRes.json();
                setUserData(currentUser);

                // Verificación de permisos de administrador
                const adminRes = await fetch('https://proyecto-ids.vercel.app/api/checkAdmin', {
                    method: 'GET',
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!adminRes.ok) {
                    const errorBody = await adminRes.json();
                    console.error("Error al verificar admin - Estado HTTP:", adminRes.status, "Cuerpo:", errorBody);
                    throw new Error("No tienes permisos de administrador.");
                }
                const adminData = await adminRes.json();
                setIsAdmin(adminData.isAdmin);

                // --- CLAVE: Obtención de TODAS las tareas como administrador ---
                // Esta es la misma llamada API que en AdminMain, para asegurar consistencia
                const tareasRes = await fetch('https://proyecto-ids.vercel.app/api/tasks', {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!tareasRes.ok) {
                    const errorBody = await tareasRes.json();
                    console.error("Error al obtener tareas - Estado HTTP:", tareasRes.status, "Cuerpo:", errorBody);
                    if (tareasRes.status === 401 || tareasRes.status === 403) {
                        Alert.alert("Error de Acceso", errorBody.message || "No tienes permisos para ver las tareas. Inicia sesión nuevamente.");
                        router.push('/');
                    } else {
                        throw new Error(`Error al cargar tareas: ${errorBody.message || tareasRes.statusText}`);
                    }
                }
                const tareasData: Tarea[] = await tareasRes.json();
                console.log("Datos de tareas recibidos de API /tasks:", tareasData); // Depuración: Revisa aquí la estructura real de tus tareas
                setTareas(tareasData); // Almacenamos todas las tareas recibidas

                // Fetch de todos los usuarios
                const allUsersRes = await fetch('https://proyecto-ids.vercel.app/api/users', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!allUsersRes.ok) {
                    const errorBody = await allUsersRes.json();
                    console.error("Error al obtener usuarios - Estado HTTP:", allUsersRes.status, "Cuerpo:", errorBody);
                    throw new Error(`Error al cargar usuarios: ${errorBody.message || allUsersRes.statusText}`);
                }
                const allUsersData: Usuario[] = await allUsersRes.json();
                setAllUsers(Array.isArray(allUsersData) ? allUsersData : []);

                // Fetch de asistencias para determinar usuarios disponibles
                const attendanceRes = await fetch('https://proyecto-ids.vercel.app/api/attendance', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!attendanceRes.ok) {
                    const errorBody = await attendanceRes.json();
                    console.error("Error al obtener asistencias - Estado HTTP:", attendanceRes.status, "Cuerpo:", errorBody);
                    throw new Error(`Error al cargar asistencias: ${errorBody.message || attendanceRes.statusText}`);
                }
                const attendanceData = await attendanceRes.json();

                const today = new Date().toISOString().slice(0, 10);

                const presentUserIds = new Set(
                    (Array.isArray(attendanceData) ? attendanceData : [])
                        .filter((att: any) =>
                            att.date === today &&
                            att.checkIn &&
                            (!att.checkOut || new Date(att.checkOut) > new Date(att.checkIn))
                        )
                        .map((att: any) => att.userId)
                );

                const usersToFilter = Array.isArray(allUsersData) ? allUsersData : [];

                const filteredUsers = usersToFilter.filter((user: Usuario) => {
                    const isPresent = presentUserIds.has(user.uid);

                    // Verifica si el usuario tiene alguna tarea "en progreso" (normalizando a minúsculas)
                    const hasInProgressTask = (Array.isArray(tareasData) ? tareasData : []).some((task: Tarea) =>
                        task.assignedTo === user.uid && task.status?.toLowerCase() === "en progreso"
                    );

                    return isPresent && !hasInProgressTask;
                });
                setAvailableUsers(filteredUsers);

            } catch (error: any) {
                console.error("Error general en init() de ReasignarTarea:", error);
                Alert.alert("Error de Carga", error.message || "Ocurrió un error al cargar los datos necesarios.");
                router.back();
            }
        };

        init();
    }, [router.isReady]); // Dependencia router.isReady para asegurar que el router esté listo antes de ejecutar init

    const handleReassign = async () => {
        const token = await AsyncStorage.getItem('userToken');

        if (!token) {
            Alert.alert("Error de Sesión", "No se encontró un token de autenticación. Inicia sesión de nuevo.");
            router.push('/');
            return;
        }

        if (!isAdmin) {
            Alert.alert("Error", "No tienes permisos para reasignar tareas.");
            return;
        }

        if (!selectedTaskId || !newAssignedToUser) {
            Alert.alert("Error", "Debes seleccionar una tarea y un nuevo trabajador.");
            return;
        }

        try {
            const response = await fetch(`https://proyecto-ids.vercel.app/api/reassign-task/${selectedTaskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    newAssignedToUid: newAssignedToUser,
                    adminUid: userData?.uid,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                console.error("Error en reasignación - Estado HTTP:", response.status, "Cuerpo:", result);
                if (response.status === 401 || response.status === 403) {
                    Alert.alert("Error de Permisos", result.message || "No tienes autorización para reasignar esta tarea.");
                } else {
                    throw new Error(result.message || 'Error al reasignar tarea.');
                }
            }
            Alert.alert("Éxito", result.message);
            router.back();
        } catch (error: any) {
            console.error("Excepción en handleReassign:", error);
            Alert.alert("Error", error.message || "Ocurrió un error inesperado al reasignar.");
        }
    };

    return (
        <ScrollView contentContainerStyle={globalStyles.container}>
            <Text style={globalStyles.title}>Reasignar Tarea</Text>

            <Text style={globalStyles.subtitle}>Selecciona una tarea:</Text>
            <View style={styles.pickerWrapper}>
                <Picker
                    selectedValue={selectedTaskId}
                    onValueChange={(itemValue) => setSelectedTaskId(itemValue)}
                    style={styles.picker}
                >
                    <Picker.Item label=" Selecciona una tarea" value="" />
                    
                    {Array.isArray(tareas) && tareas
                        .filter(tarea => {
                            // Normalizamos los valores para asegurar que el filtro sea robusto,
                            const assignedToNormalized = tarea.assignedTo === null || typeof tarea.assignedTo === 'undefined' ? '' : tarea.assignedTo;
                            const statusNormalized = tarea.status?.toLowerCase(); // Asegúrate de comparar en minúsculas

                            const isNotAssigned = assignedToNormalized === "";
                            const isPendingOrInProgress = statusNormalized === "pendiente" || statusNormalized === "en progreso";

                            // Agregamos un console.log aquí para depurar cada tarea individualmente
                            console.log(`[ReasignarPicker Filter] Tarea: ${tarea.title}, AssignedTo: '${tarea.assignedTo}' (Normalized: '${assignedToNormalized}'), Status: '${tarea.status}' (Normalized: '${statusNormalized}'), Pasa filtro: ${isNotAssigned || isPendingOrInProgress}`);

                            return isNotAssigned || isPendingOrInProgress;
                        })
                        .map((tarea) => (
                            <Picker.Item
                                key={tarea.id}
                                label={`${tarea.title} (Asignado a: ${tarea.assignedTo || 'No Asignado'}) - Estado: ${tarea.status}`}
                                value={tarea.id}
                            />
                        ))}
                    {/* Mostrar mensaje si no hay tareas filtradas */}
                    {Array.isArray(tareas) && tareas.filter(tarea => {
                        const assignedToNormalized = tarea.assignedTo === null || typeof tarea.assignedTo === 'undefined' ? '' : tarea.assignedTo;
                        const statusNormalized = tarea.status?.toLowerCase();
                        return (assignedToNormalized === "" || assignedToNormalized === null || typeof assignedToNormalized === 'undefined') ||
                               (statusNormalized === "pendiente" || statusNormalized === "en progreso");
                    }).length === 0 && (
                        <Picker.Item label="No hay tareas disponibles para reasignar" value="" />
                    )}
                </Picker>
            </View>
            <Text style={globalStyles.subtitle}>Reasignar a:</Text>
            <View style={styles.pickerWrapper}>
                <Picker
                    selectedValue={newAssignedToUser}
                    onValueChange={(itemValue) => setNewAssignedToUser(itemValue)}
                    style={styles.picker}
                >
                    <Picker.Item label=" Selecciona un trabajador" value="" />
                    {Array.isArray(availableUsers) && availableUsers.map((user: Usuario) => (
                        <Picker.Item
                            key={user.uid}
                            label={user.displayName || user.name || user.email || user.uid}
                            value={user.uid}
                        />
                    ))}
                </Picker>
            </View>
            <TouchableOpacity style={globalStyles.button} onPress={handleReassign}>
                <Text style={globalStyles.buttonText}>Reasignar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[globalStyles.button, { backgroundColor: '#999', marginTop: 16 }]} onPress={() => router.back()}>
                <Text style={globalStyles.buttonText}>Volver</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    pickerWrapper: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        marginBottom: 20,
    },
    picker: {
        height: 50,
        width: '100%',
    },
});