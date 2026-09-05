const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const EMAIL_TO = process.env.EMAIL_TO || 'laithmezzi1919@gmail.com';

const hasRealSmtpCredentials = Boolean(
  process.env.SMTP_USER &&
  process.env.SMTP_PASS &&
  !process.env.SMTP_USER.includes('your-') &&
  !process.env.SMTP_USER.includes('yourgmail') &&
  !process.env.SMTP_PASS.includes('your-') &&
  !process.env.SMTP_PASS.includes('your')
);

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname)));

function buildOrderSummary(order) {
  const total = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0) + order.deliveryFee;
  const itemsSummary = order.items
    .map((item) => `- ${item.name} x${item.quantity} = $${item.price * item.quantity}`)
    .join('\n');

  return {
    total,
    itemsSummary,
    paymentLabel: order.paymentMethod === 'visa' ? 'Visa / Card' : 'Cash on delivery',
    cardLabel: order.paymentMethod === 'visa' ? (order.cardNumber || 'Not provided') : 'Cash on delivery',
    plainText: `
New order from Noolah Creation

Customer Information:
Name: ${order.customer.fullName}
Phone: ${order.customer.phone}
Email: ${order.customer.email}
City: ${order.customer.city}
Region: ${order.customer.area}
Postal Code: ${order.customer.postalCode}
Address: ${order.customer.address}
Payment: ${order.paymentMethod === 'visa' ? 'Visa / Card' : 'Cash on delivery'}
Card Number: ${order.paymentMethod === 'visa' ? order.cardNumber || 'Not provided' : 'Cash on delivery'}
Delivery Notes: ${order.customer.notes || 'No notes'}

Order Items:
${itemsSummary}

Delivery Fee: $${order.deliveryFee}
Total: $${total}
`.trim(),
    html: `
      <div style="font-family: Arial, sans-serif; color: #1c1715; line-height: 1.6;">
        <h2 style="margin-bottom: 12px;">New Noolah Creation Order</h2>
        <p><strong>Name:</strong> ${order.customer.fullName}</p>
        <p><strong>Phone:</strong> ${order.customer.phone}</p>
        <p><strong>Email:</strong> ${order.customer.email}</p>
        <p><strong>City:</strong> ${order.customer.city}</p>
        <p><strong>Region:</strong> ${order.customer.area}</p>
        <p><strong>Postal Code:</strong> ${order.customer.postalCode}</p>
        <p><strong>Address:</strong> ${order.customer.address}</p>
        <p><strong>Payment:</strong> ${order.paymentMethod === 'visa' ? 'Visa / Card' : 'Cash on delivery'}</p>
        <p><strong>Card Number:</strong> ${order.paymentMethod === 'visa' ? order.cardNumber || 'Not provided' : 'Cash on delivery'}</p>
        <p><strong>Delivery Notes:</strong> ${order.customer.notes || 'No notes'}</p>

        <h3 style="margin-top: 24px; margin-bottom: 10px;">Order Items</h3>
        <ul>
          ${order.items
            .map((item) => `<li>${item.name} x${item.quantity} = $${item.price * item.quantity}</li>`)
            .join('')}
        </ul>

        <p><strong>Delivery Fee:</strong> $${order.deliveryFee}</p>
        <p><strong>Total:</strong> $${total}</p>
      </div>
    `
  };
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT || 587),
  secure: Number(process.env.SMTP_PORT || 587) === 465,
  auth: hasRealSmtpCredentials
    ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    : undefined
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Noolah backend is running.' });
});

app.post('/api/orders', async (req, res) => {
  try {
    const { customer, items, paymentMethod, cardNumber, deliveryFee } = req.body;

    if (!customer || !customer.fullName || !customer.phone || !customer.email || !customer.city || !customer.area || !customer.postalCode || !customer.address) {
      return res.status(400).json({ error: 'Missing customer information.' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Your cart is empty.' });
    }

    const normalizedOrder = {
      customer,
      items,
      paymentMethod: paymentMethod || 'cash',
      cardNumber: cardNumber || '',
      deliveryFee: Number(deliveryFee || 15)
    };

    const summary = buildOrderSummary(normalizedOrder);

    if (!hasRealSmtpCredentials) {
      console.log('SMTP not configured or using placeholder credentials. Order captured but not sent:');
      console.log(summary.plainText);
      return res.status(200).json({
        success: true,
        message: 'Order received successfully. Email sending is paused until valid SMTP credentials are added in the .env file.'
      });
    }

    try {
      await transporter.sendMail({
        from: `"Noolah Creation" <${process.env.SMTP_USER}>`,
        to: EMAIL_TO,
        replyTo: customer.email,
        subject: `New Noolah Creation Order - ${customer.fullName}`,
        text: summary.plainText,
        html: summary.html
      });

      return res.status(200).json({
        success: true,
        message: 'Order placed successfully and email sent.'
      });
    } catch (mailError) {
      console.error('SMTP send failed:', mailError);
      return res.status(200).json({
        success: true,
        message: 'Order received successfully. The email delivery step failed, but your order was accepted.'
      });
    }
  } catch (error) {
    console.error('Order error:', error);
    return res.status(500).json({
      error: 'Could not process order. Please try again.'
    });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Noolah backend is running on http://localhost:${PORT}`);
});
