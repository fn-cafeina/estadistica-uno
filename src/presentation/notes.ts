export interface SceneNote {
  title: string;
  notes: string[];
}

export const SCENE_NOTES: readonly SceneNote[] = [
  {
    title: "Portada",
    notes: ["Presentamos el tema. La nube de puntos introduce la muestra."],
  },
  {
    title: "Introducción",
    notes: [
      "Presentamos al grupo y el objetivo de la exposición.",
      "Ubicamos la muestra y el tipo de análisis que vamos a hacer.",
    ],
  },
  {
    title: "La pregunta",
    notes: [
      "Presentamos la pregunta y las variables.",
      "Aclaramos que buscamos una asociación, no una relación causal.",
    ],
  },
  {
    title: "La muestra",
    notes: [
      "Explicamos que la muestra es fija en 80 y que la semilla permite reproducirla.",
      "Mostramos que al regenerarla se recalculan todas las escenas.",
    ],
  },
  {
    title: "La forma",
    notes: [
      "Explicamos la distribución de la variable.",
      "Cambiamos entre pantalla, estudio, sueño y promedio para comparar formas.",
    ],
  },
  {
    title: "El vínculo",
    notes: [
      "Movemos el slider para mostrar cómo cambia la predicción.",
      "Recordamos que la recta describe esta muestra y no se extrapola fuera del rango.",
    ],
  },
  {
    title: "El punto que cambia todo",
    notes: [
      "Arrastramos el punto ámbar.",
      "Mostramos cómo cambian la correlación y la recta. Un solo valor puede mover el resultado.",
    ],
  },
  {
    title: "La prueba",
    notes: [
      "Mostramos los conteos observados.",
      "Alternamos a esperado para explicar qué veríamos si no hubiera relación.",
      "Leemos el valor p y la advertencia sobre supuestos.",
    ],
  },
  {
    title: "Conclusión",
    notes: [
      "Cerramos con tres ideas: muestra, relación y causalidad.",
      "Terminamos con una despedida breve. No abrimos nuevas preguntas.",
    ],
  },
];
