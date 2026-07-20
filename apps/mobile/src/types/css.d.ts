// Declaraciones para los imports CSS del template Expo (variantes .web)
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.css';
