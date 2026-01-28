// Minimal Angular Material module shims for Jest/TypeScript in this library.
// These satisfy the TypeScript compiler when running tests, while the real
// implementations are provided at runtime from `@angular/material`.

declare module '@angular/material/form-field' {
  export class MatFormFieldModule {}
}

declare module '@angular/material/input' {
  export class MatInputModule {}
}

declare module '@angular/material/select' {
  export class MatSelectModule {}
}

declare module '@angular/material/button' {
  export class MatButtonModule {}
}

declare module '@angular/material/checkbox' {
  export class MatCheckboxModule {}
}

