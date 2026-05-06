import Stripe from 'stripe';
import { Empresa } from '../models/empresa.model.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const crearSesionCheckout = async (req, res) => {
  try {
    const { empresa_id } = req.body;

    if (!empresa_id) {
      return res.status(400).json({ message: 'El ID de empresa es requerido' });
    }

    const empresa = await Empresa.findByPk(empresa_id);
    if (!empresa) {
      return res.status(404).json({ message: 'Empresa no encontrada' });
    }

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
                'Presupuestos ilimitados, soporte técnico prioritario y exportación PDF con tu logo.',
            },
            unit_amount: 3900, // 39€ en céntimos
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
      success_url: `${process.env.FRONTEND_URL}/stripe-pagos?payment=success`,
      cancel_url: `${process.env.FRONTEND_URL}/stripe-pagos`,
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error al crear la sesión de pago' });
  }
};

export const webhookStripe = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log('Webhook signature verification failed:', err.message);
    return res.status(400).json({ message: `Webhook error: ${err.message}` });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const empresa_id = session.metadata?.empresa_id;

    if (empresa_id) {
      try {
        const empresa = await Empresa.findByPk(empresa_id);
        if (empresa) {
          const fechaVencimiento = new Date();
          fechaVencimiento.setMonth(fechaVencimiento.getMonth() + 1);

          await empresa.update({
            suscripcion_activa: true,
            fecha_vencimiento: fechaVencimiento,
            fecha_actualizacion: new Date(),
          });
          console.log(`Suscripción activada para empresa ${empresa_id}`);
        }
      } catch (error) {
        console.log('Error al activar suscripción:', error);
      }
    }
  }

  res.json({ received: true });
};
