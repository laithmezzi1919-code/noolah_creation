# Noolah Creation Boutique

A luxury boutique storefront for Noolah Creation with product selection, cart, checkout, and backend email order submission.

## Local run

1. Install dependencies:
   npm install
2. Update your SMTP credentials in `.env`
3. Start the app:
   npm start
4. Open:
   http://localhost:3001

## Deploy to Render

1. Push this folder to GitHub.
2. Create a new Render web service.
3. Connect the repository.
4. Use the included `render.yaml` file.
5. Add your Gmail SMTP values in Render environment variables.
6. Deploy.

## Required environment values

- `EMAIL_TO=laithmezzi1919@gmail.com`
- `SMTP_HOST=smtp.gmail.com`
- `SMTP_PORT=587`
- `SMTP_USER=yourgmail@gmail.com`
- `SMTP_PASS=your-gmail-app-password`

## Important note

The project is set up to send real order emails only after SMTP credentials are configured.
