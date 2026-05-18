from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings

from .models import Documento


def enviar_correo_admin(asunto, mensaje):

    send_mail(
        subject=asunto,
        message=mensaje,
        from_email=settings.EMAIL_HOST_USER,
        recipient_list=[settings.ADMIN_EMAIL],
        fail_silently=False,
    )


# ==========================================
# CREAR / ACTUALIZAR DOCUMENTO
# ==========================================

@receiver(post_save, sender=Documento)
def documento_guardado(sender, instance, created, **kwargs):

    # NUEVO DOCUMENTO
    if created:

        enviar_correo_admin(
            asunto='Nuevo documento registrado',
            mensaje=(
                f'Se registró un nuevo documento.\n\n'
                f'Cliente: {instance.cliente.nombre}\n'
                f'Tipo: {instance.tipo.nombre_tipo}\n'
                f'Vencimiento: {instance.fecha_vencimiento}'
            )
        )

    # DOCUMENTO ACTUALIZADO
    else:

        enviar_correo_admin(
            asunto='Documento actualizado',
            mensaje=(
                f'Se actualizó un documento.\n\n'
                f'Cliente: {instance.cliente.nombre}\n'
                f'Tipo: {instance.tipo.nombre_tipo}\n'
                f'Nueva fecha: {instance.fecha_vencimiento}'
            )
        )


# ==========================================
# ELIMINAR DOCUMENTO
# ==========================================

@receiver(post_delete, sender=Documento)
def documento_eliminado(sender, instance, **kwargs):

    enviar_correo_admin(
        asunto='Documento eliminado',
        mensaje=(
            f'Se eliminó un documento.\n\n'
            f'Cliente: {instance.cliente.nombre}\n'
            f'Tipo: {instance.tipo.nombre_tipo}'
        )
    )