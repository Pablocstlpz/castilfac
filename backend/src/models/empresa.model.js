import { DataTypes } from 'sequelize';
import { sequelize } from '../data/db.js';

export const Empresa = sequelize.define(
  'Empresa',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre_comercial: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    razon_social: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    nif: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    telefono: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    direccion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    codigo_postal: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    ciudad: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    provincia: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    suscripcion_activa: {
      //true si la empresa esta al dia con su suscripcion, false si no
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: 0,
    },
    fecha_vencimiento: {
      //fecha hasta la que la empresa esta al dia con el pago
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    activo: {
      //para borrado logico o bloqueo manual por superadmin
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: 1,
    },
    logo_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    fecha_registro: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    fecha_actualizacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    email_verificado: {
      //true si la empresa ya ha verificado su email pulsando el link, false hasta entonces
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    token_verificacion: {
      //BD: varchar(255). Aqui guardo el sha256 del token, no el token plano
      //el plano solo va por email para que el usuario lo presente al pulsar el link
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: 'empresas',
    timestamps: false, //ya tengo columnas de fecha propias
  }
);

//limpieza automatica al serializar el modelo a JSON
//asi el token de verificacion no se filtra en ninguna respuesta de la API
//si se filtrase, cualquiera podria verificar el correo de una empresa ajena
Empresa.prototype.toJSON = function () {
  const datos = { ...this.get() };
  delete datos.token_verificacion;
  return datos;
};
