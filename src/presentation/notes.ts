export interface SceneNote {
  title: string;
  notes: string[];
}

export const SCENE_NOTES: readonly SceneNote[] = [
  {
    title: "Portada",
    notes: [
      "No expliques nada todavía. Dejá que la nube de puntos haga la primera impresión.",
      "Preguntá al público qué espera encontrar en una muestra de 80 estudiantes.",
    ],
  },
  {
    title: "La apuesta",
    notes: [
      "Pedí un número entre -1 y 1. Mové el slider sin revelar el valor real.",
      "Revelá y compará la apuesta con la correlación de la muestra.",
      "Aclará que una muestra no prueba causalidad.",
    ],
  },
  {
    title: "La muestra",
    notes: [
      "Aclará que los datos son sintéticos y que la semilla permite reproducirlos.",
      "Generá otra muestra para mostrar que la tabla y todo lo que sigue se recalculan.",
    ],
  },
  {
    title: "La forma",
    notes: [
      "Preguntá qué forma esperaban antes de cambiar de variable.",
      "Cambiá entre pantalla, estudio, sueño y promedio. Señalá la media y la dispersión.",
    ],
  },
  {
    title: "El vínculo",
    notes: [
      "Movés el slider y mostrás la predicción sobre la recta.",
      "Recordá que la recta describe esta muestra y que no se extrapola fuera del rango.",
    ],
  },
  {
    title: "El punto que cambia todo",
    notes: [
      "Invitá a alguien a arrastrar el punto ámbar.",
      "Mostrá cómo cambia r y la recta. La correlación es sensible a valores extremos.",
    ],
  },
  {
    title: "La prueba",
    notes: [
      "Mostrá primero los conteos observados.",
      "Alterná a esperado y explicá que es lo que veríamos si no hubiera relación.",
      "Leé el valor p y la advertencia sobre supuestos.",
    ],
  },
  {
    title: "Cierre",
    notes: [
      "Cerrá con la pregunta: ¿qué no podemos concluir?",
      "Tres ideas: muestra, asociación y contexto.",
    ],
  },
];
