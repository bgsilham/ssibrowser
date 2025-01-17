import axios from 'axios'

export async function sendTelegramNotification(message: string): Promise<void> {
    const bottoken = process.env.NEXT_PUBLIC_TELEGRAM_BOT_API_TOKEN
    const chatid = process.env.NEXT_PUBLIC_TELEGRAM_GROUP_CHAT_ID

    if (bottoken !== undefined && chatid !== undefined) {
        const url = `https://api.telegram.org/bot${bottoken}/sendMessage`
        const data = {
            chat_id: chatid,
            text: message,
        }
        try {
            await axios.post(url, data)
            console.log('Telegram notification sent successfully')
        } catch (error) {
            console.error('Failed to send Telegram notification:', error)
        }
    }
}

// Example usage
//sendTelegramNotification('Hope you have a great day!')
