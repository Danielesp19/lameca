/**
 * Interruptores de funcionalidad, para apagar cosas sin borrar su código.
 *
 * La idea es que reactivar sea cambiar UNA constante acá, no volver a escribir
 * lo que se quitó: el flujo completo (carrito, notas, envío por WhatsApp,
 * pedidos por mesa con QR) sigue intacto detrás del interruptor.
 */

/**
 * Pedidos desde la carta (botón "Agregar al pedido", carrito flotante y envío
 * del pedido por WhatsApp).
 *
 * Apagado TEMPORALMENTE a pedido del cliente: por ahora no van a manejar
 * mensajes pregrabados de pedido, así que la carta queda solo para consultar.
 * El botón de WhatsApp de contacto directo NO depende de esto y sigue visible.
 *
 * Para volver a activarlo: poner `true`. No hace falta tocar nada más.
 */
export const PEDIDOS_HABILITADOS = false;
