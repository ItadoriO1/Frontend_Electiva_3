export interface Vuelo{
    id:null|number
    codigoVuelo:string
    aerolinea:string
    origen:string
    destino:string
    avionId:string
    pilotoId:string
    fecha:Date
    hora:Date
    duracionMinutos:number
    estado:string
    precioBase:number
}