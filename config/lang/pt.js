/**
 * Portuguese language file for StripeCord
 */

module.exports = {
    // Common messages
    subscription: {
        name: "Assinatura Stripe-Cord",
        accountLinking: `${process.env.SUBSCRIPTION_NAME} - Vinculação de Conta`,
        linkDescription: "Clique no botão abaixo para vincular o e-mail da sua conta Stripe com sua conta Discord.\n\nIsso dará acesso a conteúdos e recursos exclusivos para assinantes.",
        linkButtonFooter: "Você também pode usar o comando /link diretamente com seu e-mail."
    },
    
    // Buttons
    buttons: {
        linkStripeAccount: "Vincular Conta Stripe",
        manageSubscriptions: "Gerenciar Assinaturas"
    },
    
    // Command responses
    commands: {
        button: {
            success: "Uhuul! Mensagem de configuração do botão enviada."
        }
    },
    
    // Status messages
    status: {
        checking: "Estamos verificando o status da sua conta para mais informações.",
        holdOn: "Aguarde um momento. Isso pode levar alguns segundos."
    }
};