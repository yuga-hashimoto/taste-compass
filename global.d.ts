// global.d.ts - TypeScript アンビエント宣言ファイル

declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.css' {
  const content: any;
  export default content;
}
