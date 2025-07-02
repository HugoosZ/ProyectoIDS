export async function encryptUID(rut: string) {
    if(!rut){
      throw new Error("No se proporcionó el RUT")
    }
    try {
      const response = await fetch("https://proyecto-ids.vercel.app/api/findByRut", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rut: rut })
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error HTTP: ${response.status}`);
      }
  
      const data = await response.json();
      return data.uid; // Retornamos el UID del usuario encontrado
    } catch (error) {
      //console.error("Error al buscar usuario por RUT:", error);
      throw error;
    }
  }