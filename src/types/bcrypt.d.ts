// src/types/bcrypt.d.ts
declare module 'bcrypt' {
    export * from 'bcryptjs';
    import bcryptjsDefault from 'bcryptjs';
    export default bcryptjsDefault;
}
