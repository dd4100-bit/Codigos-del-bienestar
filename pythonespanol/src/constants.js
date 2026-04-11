export const C = {
  burgundy:    "#6B1223",
  burgundyMid: "#8B1A2E",
  gold:        "#C8971F",
  olive:       "#3A5A2A",
  cream:       "#F5F0E8",
  creamDark:   "#EDE6D6",
  text:        "#1A1008",
  textMid:     "#4A3020",
  textLight:   "#8A7060",
  border:      "#C8A882",
  white:       "#FFFFFF",
};

export const T = {
  sans:  '"Noto Sans", "Open Sans", "Helvetica Neue", Arial, sans-serif',
  serif: '"Montserrat", sans-serif',
  mono:  '"Courier New", monospace',
  xs: 9, sm: 11, base: 13, md: 15, lg: 17,
  light: 300, normal: 400, bold: 700, black: 900,
  tight: 0, normal_spacing: 1, wide: 2, wider: 3, widest: 4,
};

export const S = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };

export function btnPrimary(disabled) {
  return {
    padding: `${S.md}px ${S.lg}px`,
    border: `1px solid ${disabled ? C.border : C.burgundy}`,
    background: disabled ? C.creamDark : C.burgundy,
    color: disabled ? C.textLight : C.gold,
    fontSize: T.sm, fontWeight: T.bold, fontFamily: T.mono,
    letterSpacing: T.wider, textTransform: "uppercase",
    cursor: disabled ? "not-allowed" : "pointer", transition: "all 0.2s",
  };
}

export function btnSecondary() {
  return {
    padding: `${S.sm}px ${S.lg}px`, border: `1px solid ${C.burgundy}`,
    background: C.white, color: C.burgundy, fontSize: T.sm,
    fontWeight: T.bold, fontFamily: T.sans, letterSpacing: T.normal_spacing,
    textTransform: "uppercase", cursor: "pointer", transition: "all 0.15s",
  };
}

export function btnGhost() {
  return {
    padding: `${S.sm}px ${S.lg}px`, border: `1px solid ${C.border}`,
    background: "transparent", color: C.textLight, fontSize: T.sm,
    fontFamily: T.sans, letterSpacing: T.normal_spacing,
    textTransform: "uppercase", cursor: "pointer", transition: "all 0.15s",
  };
}

export function label() {
  return {
    fontSize: T.xs, letterSpacing: T.widest, color: C.textLight,
    textTransform: "uppercase", fontFamily: T.sans, fontWeight: T.light,
  };
}

export const AMLO_SYSTEM_PROMPT = `Eres "El Profesor" — un debugger de código en español.

REGLA DE ORO:
- SOLO la primera línea tiene humor — inteligente, seco, universal.
- TODO lo demás es técnico puro: directo, sin relleno, sin personalidad extra.
- Máximo 150 palabras total.
- Cualquier lenguaje: Python, JavaScript, Java, SQL, lo que sea.
- NUNCA recomendar arquitectura, organización de archivos, o mejores prácticas.
- Si recibes una imagen, extrae el código que aparece en ella y analízalo como si hubiera sido pegado directamente.

REGLAS CRÍTICAS:
- NUNCA repitas las listas, arrays, o datos del input en tu respuesta.
- El código corregido siempre debe estar COMPLETO.
- Si el error es de lógica, muestra solo la parte corregida.
- ANTES de diagnosticar un error, traza mentalmente la ejecución del código paso a paso. Si el código es correcto y produce el resultado esperado, dilo claramente — no inventes errores que no existen.
- Si el código está bien, responde: una línea de apertura seca + "El código es correcto." + una línea explicando por qué funciona. Nada más.
- ANALIZA la estructura de los datos antes de proponer una solución. Si hay listas con strings que contienen indices (ej: N1, E3), extrae ese indice y usalo — no asumas que las listas son paralelas por posicion.
- REVISA cada condición lógica. Un 'elif' asume que si la primera condición es falsa, la segunda es verdadera sin verificarla. Si las condiciones son independientes, usa 'if' separados. Solo usa 'elif' cuando las condiciones sean mutuamente excluyentes Y exhaustivas.
- Si el enunciado especifica un sistema de encoding o conversión de valores, DEBES usarlo exactamente como lo describe. No asumas ASCII, % 256, ni ningún otro sistema por defecto.

FRASES DE APERTURA:
- SyntaxError: "Python intentó leerlo. No pudo. Nadie pudo."
- NameError/undefined: "Usaste algo que no existe. Como buscar WiFi en el metro."
- IndentationError: "Los espacios importan. Siempre importaron."
- IndexError/out of bounds: "Le pediste el elemento 99 a una lista de 3. Optimista."
- TypeError: "Sumaste un número con un texto. El resultado es confusión."
- Division by zero: "Entre cero no se divide. En matemáticas ni en la vida."
- KeyError: "Esa llave no está en el diccionario. Nunca estuvo."
- AttributeError: "Ese objeto no tiene ese método. Lo estás confundiendo con otro."
- ImportError: "Ese módulo no existe o no está instalado."
- Código de AI roto: "El código llegó de una AI. Llegó roto también."
- Error lógico sin excepción: "Corre. No falla. Tampoco hace lo que debería."
- Error general: "Algo está mal. Vamos a encontrarlo."

FORMATO — exactamente este, sin cambios:

[Una línea. Inteligente. Seca. Universal.]

El problema:
[2-3 líneas. Técnico. Por qué no funciona.]

✅ Así se hace:
[Solo la lógica corregida. Sin repetir datos. Completo.]

► [Una línea. El insight clave.]

Español neutro.`;

export const LOADING_FRASES = [
  "Consultando con mis asesores...",
  "Revisando su catastrófico código...",
  "Analizando el desastre...",
  "Fíjense bien, a ver qué hicieron...",
  "No es tema menor, esperen...",
  "Hay que ser honestos aquí...",
  "Con todo respeto, analizando...",
];

export const EJEMPLOS = [
  { label: "AI — ChatGPT Python", code: `# Generated by ChatGPT\ndef calcular_promedio(numeros):\n    total = sum(numeros)\n    promedio = total / len(numeros)\n    return promedio\n\nresultado = calcular_promedio([])\nprint(resultado)` },
  { label: "AI — Copilot JS", code: `// GitHub Copilot suggestion\nfunction buscarUsuario(usuarios, nombre) {\n  for (let i = 0; i <= usuarios.length; i++) {\n    if (usuarios[i].nombre === nombre) return usuarios[i].edad;\n  }\n}\nconsole.log(buscarUsuario([], "Diego") + 5);` },
  { label: "Bug — Python", code: `if x = 10\n    print("hola")` },
  { label: "Bug — JavaScript", code: `const nombre = "Diego"\nconsole.log(nombre.toUppercase())` },
  { label: "Bug — SQL", code: `SELECT nombre, edad FROM usuarios WHERE edad > 18 AND\nORDER BY nombre` },
  { label: "Construir", code: `quiero hacer una calculadora en JavaScript que sume, reste, multiplique y divida` },
  { label: "Explicar loop", code: `qué es un loop y para qué sirve, explícamelo simple` },
  { label: "Mejorar código", code: `# mejora este código:\nnumeros = [1,2,3,4,5]\ntotal = 0\nfor n in numeros:\n    total = total + n\nprint(total)` },
];
