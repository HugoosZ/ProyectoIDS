export async function fetchUsers(jwt: string) {
    if(!jwt){
      throw new Error("No se proporciono token JWT")
    }
    try {
      const response = await fetch("https://proyecto-ids.vercel.app/api/auth/validate-token", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      console.log("HTTT recibido")
  
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
  
      return await response.json();
    } catch (error) {
      console.error("Error en fetchUsers:", error);
      throw error;
    }
  }