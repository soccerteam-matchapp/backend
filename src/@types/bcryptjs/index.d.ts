declare module "bcryptjs" {
    // 최소 선언: 런타임만 통과하면 되므로 any로 둠
    export function genSaltSync(rounds?: number): string;
    export function hashSync(data: string, salt: string): string;
    export function compareSync(data: string, encrypted: string): boolean;
    const _default: any;
    export default _default;
}
