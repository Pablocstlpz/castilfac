import Stripe from 'stripe';
import { Empresa } from '../models/empresa.model.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const crearSesionCheckout = async (req, res) => {
  try {
    //recojo el id de la empresa del body
    const { empresa_id } = req.body;

    //valido que el id de la empresa sea requerido
    if (!empresa_id) {
      return res.status(400).json({ message: "El ID de empresa es requerido" });
    }

    //busco la empresa por el id
    const empresa = await Empresa.findByPk(empresa_id);

    //valido que la empresa exista
    if (!empresa) {
      return res.status(404).json({ message: "Empresa no encontrada" });
    }

    //creo la sesion de checkout en stripe con el plan mensual de 39€
    //{CHECKOUT_SESSION_ID} es un template de stripe que sustituye por el id real al redirigir
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Plan Profesional SaaS - Castilfac',
              description:
                'Presupuestos ilimitados y soporte técnico prioritario.',
            },
            unit_amount: 3900,
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        empresa_id: String(empresa_id),
      },
      success_url: `${process.env.FRONTEND_URL}/stripe-pagos?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/stripe-pagos`,
    });

    //devuelvo la url de la sesion de checkout
    res.status(200).json({ url: session.url });
  } catch (error) {
    //muestro el error por consola
    console.log(error);
    //devuelvo un mensaje de error
    res.status(500).json({ message: "Error al crear la sesión de pago" });
  }
};

export const webhookStripe = async (req, res) => {
  //recojo la firma de stripe y el secreto del webhook
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  //verifico la firma del webhook para confirmar que viene de stripe
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    //muestro el error por consola
    console.log("Webhook signature verification failed:", err.message);
    //devuelvo un error si la firma no es valida
    return res.status(400).json({ message: `Webhook error: ${err.message}` });
  }

  //proceso el evento cuando el pago se ha completado
  if (event.type === 'checkout.session.completed') {
    //recojo la sesion y el id de la empresa de los metadatos
    const session = event.data.object;
    const empresa_id = session.metadata?.empresa_id;

    if (empresa_id) {
      try {
        //busco la empresa por el id
        const empresa = await Empresa.findByPk(empresa_id);

        if (empresa) {
          //calculo la fecha de vencimiento un mes desde ahora
          const fechaVencimiento = new Date();
          fechaVencimiento.setMonth(fechaVencimiento.getMonth() + 1);

          //activo la suscripcion de la empresa y actualizo la fecha de vencimiento
          await empresa.update({
            suscripcion_activa: true,
            fecha_vencimiento: fechaVencimiento,
            fecha_actualizacion: new Date(),
          });
          console.log(`Suscripción activada para empresa ${empresa_id}`);
        }
      } catch (error) {
        //muestro el error por consola
        console.log("Error al activar suscripción:", error);
      }
    }
  }

  //confirmo a stripe que hemos recibido el evento
  res.json({ received: true });
};

export const verificarSesionPago = async (req, res) => {
  try {
    //recojo el id de la sesion del body
    const { session_id } = req.body;

    //valido que el id de la sesion sea requerido
    if (!session_id) {
      return res.status(400).json({ message: "El ID de sesión es requerido" });
    }

    //consulto la sesion directamente a stripe para obtener el estado del pago
    const session = await stripe.checkout.sessions.retrieve(session_id);

    //valido que el pago este completado
    if (session.payment_status !== 'paid') {
      return res.status(402).json({ message: "El pago aún no está confirmado" });
    }

    //recojo el id de la empresa de los metadatos de la sesion
    const empresa_id = session.metadata?.empresa_id;

    //valido que la sesion tenga empresa asociada
    if (!empresa_id) {
      return res.status(400).json({ message: "Sesión sin empresa asociada" });
    }

    //busco la empresa por el id
    const empresa = await Empresa.findByPk(empresa_id);

    //valido que la empresa exista
    if (!empresa) {
      return res.status(404).json({ message: "Empresa no encontrada" });
    }

    //solo actualizo si la suscripcion no estaba ya activa para evitar duplicados
    if (!empresa.suscripcion_activa) {
      //calculo la fecha de vencimiento un mes desde ahora
      const fechaVencimiento = new Date();
      fechaVencimiento.setMonth(fechaVencimiento.getMonth() + 1);

      //activo la suscripcion de la empresa y actualizo la fecha de vencimiento
      await empresa.update({
        suscripcion_activa: true,
        fecha_vencimiento: fechaVencimiento,
        fecha_actualizacion: new Date(),
      });
      console.log(`Suscripción activada (verificación directa) para empresa ${empresa_id}`);
    }

    //devuelvo un mensaje de exito
    res.status(200).json({ message: "Suscripción activada correctamente" });
  } catch (error) {
    //muestro el error por consola
    console.log(error);
    //devuelvo un mensaje de error
    res.status(500).json({ message: "Error al verificar la sesión de pago" });
  }
};
