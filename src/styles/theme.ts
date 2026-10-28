// Tokens de diseño tomados del Figma "App Kike Parking".
export const colors = {
  background: "#FFFFFF",
  surface: "#FFFFFF",
  primary: "#DC3B22", // rojo de botones, íconos activos y acentos
  text: "#1A1A1A",
  textLight: "#6F6F6F",
  placeholder: "#7A7A7A",
  border: "#8F8F8F", // borde de los inputs
  borderLight: "#E4E4E4", // divisores y bordes suaves
  chip: "#EFEFEF", // fondo de chips y botones circulares
  imagePlaceholder: "#D9D9D9", // cajas grises donde irán las fotos
  imageIcon: "#F4F4F4",
  black: "#0D0D0D",
  white: "#FFFFFF",
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };

export const radius = { sm: 8, md: 12, lg: 16, full: 999 };

// Sombra suave de las tarjetas y del buscador.
export const shadow = {
  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
} as const;
