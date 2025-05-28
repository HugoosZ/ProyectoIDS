// validación RUT 
exports.validarDigitoVerificador = (rut) => {
    // Eliminar puntos y guión
    const rutLimpio = rut.replace(/\./g, '').split('-');
    const numero = rutLimpio[0];
    const dv = rutLimpio[1].toLowerCase();
  
    // Calcular dígito verificador esperado
    let suma = 0;
    let multiplicador = 2;
  
    for (let i = numero.length - 1; i >= 0; i--) {
      suma += parseInt(numero.charAt(i)) * multiplicador;
      multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }
  
    const dvEsperado = 11 - (suma % 11);
    const dvCalculado = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'k' : dvEsperado.toString();
  
    return dv === dvCalculado;
  };