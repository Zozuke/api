export default async function handler(req, res) {
  const { inicio, fin } = req.query;

  const respuesta = await fetch(
    `https://api.openrouteservice.org/v2/directions/driving-car?start=${inicio}&end=${fin}`,
    {
      headers: {
        Authorization: "TU_API_KEY"
      }
    }
  );

  const datos = await respuesta.json();
  res.status(200).json(datos);
}
