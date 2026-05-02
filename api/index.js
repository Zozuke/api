
export default async function handler(req, res) {
  // ✅ Restricción de método HTTP
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { inicio, fin } = req.query;

    // ✅ Validación de presencia
    if (!inicio || !fin) {
      return res.status(400).json({
        error: "Faltan parámetros: inicio y fin (ej: ?inicio=lng,lat&fin=lng,lat)"
      });
    }

    // ✅ Validación estricta de formato
    const coordsInicio = inicio.split(",").map(Number);
    const coordsFin = fin.split(",").map(Number);

    if (
      coordsInicio.length !== 2 ||
      coordsFin.length !== 2 ||
      coordsInicio.some(isNaN) ||
      coordsFin.some(isNaN)
    ) {
      return res.status(400).json({
        error: "Formato inválido",
        detalle: "Cada coordenada debe ser: longitud,latitud (ej: -0.1276,51.5074)"
      });
    }

    // ✅ Validación de rangos geográficos
    if (
      Math.abs(coordsInicio[0]) > 180 || Math.abs(coordsInicio[1]) > 90 ||
      Math.abs(coordsFin[0]) > 180 || Math.abs(coordsFin[1]) > 90
    ) {
      return res.status(400).json({
        error: "Coordenadas fuera de rango",
        detalle: "Longitud entre -180 y 180, latitud entre -90 y 90"
      });
    }

    // ✅ Verificación de API key configurada
    if (!process.env.ORS_API_KEY) {
      console.error("ORS_API_KEY no configurada");
      return res.status(500).json({ error: "Error de configuración del servidor" });
    }

    // ✅ Fetch con manejo de errores de red
    let response;
    try {
      response = await fetch(
        "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": process.env.ORS_API_KEY  // ORS usa la key directamente sin "Bearer"
          },
          body: JSON.stringify({
            coordinates: [coordsInicio, coordsFin]
          })
        }
      );
    } catch (fetchError) {
      console.error("Error al conectar con ORS:", fetchError);
      return res.status(502).json({ error: "Error al conectar con el servicio de rutas" });
    }

    // ✅ Verificar si la respuesta es JSON válido
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error("Respuesta no JSON de ORS:", jsonError);
      return res.status(502).json({ error: "Respuesta inválida del servicio de rutas" });
    }

    // ✅ Propagación correcta de errores de ORS
    if (!response.ok) {
      console.error("Error de ORS:", data);
      return res.status(response.status).json({
        error: "Error del servicio de rutas",
        detalle: data?.error?.message || data
      });
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error("Error inesperado:", error);
    return res.status(500).json({
      error: "Error interno del servidor",
      detalle: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
}
