
// export type JWTPayloadType = {
//     id : number;
//     email : string;
//     id_role : number;
// }

export type AccessTokenType = {
    accessToken : string;
}


// src/utils/types.ts
export interface JWTPayloadType {
  id: number;
  email: string;
  role: string; // Plus flexible
  id_role: number;
  nom?: string;
  prenom?: string;
}