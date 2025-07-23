import MazoCarta from '#models/mazo_carta'

export async function generarCartillaAleatoria(): Promise<number[]> {
  // Obtener todas las cartas disponibles
  const todasLasCartas = await MazoCarta.query().select('id')
  const cartasIds = todasLasCartas.map(carta => carta.id)
  
  // Seleccionar 16 cartas aleatorias únicas
  const cartilla: number[] = []
  const cartasDisponibles = [...cartasIds]
  
  for (let i = 0; i < 16; i++) {
    const randomIndex = Math.floor(Math.random() * cartasDisponibles.length)
    cartilla.push(cartasDisponibles[randomIndex])
    cartasDisponibles.splice(randomIndex, 1)
  }
  
  return cartilla
}

export async function barajarCartas(): Promise<number[]> {
  // Obtener todas las cartas
  const todasLasCartas = await MazoCarta.query().select('id')
  const cartas = todasLasCartas.map(carta => carta.id)
  
  // Algoritmo Fisher-Yates shuffle
  for (let i = cartas.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cartas[i], cartas[j]] = [cartas[j], cartas[i]]
  }
  
  return cartas
}