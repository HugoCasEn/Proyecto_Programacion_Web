from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from datetime import timedelta

from .models import Documento, TipoDocumento , Cliente

def revisar_documentos_proximos():

    hoy = timezone.now().date()
    limite = hoy + timedelta(days=7)

    documentos = Documento.objects.filter(
        fecha_vencimiento__range=[hoy, limite]
    )

    enviados = 0

    for documento in documentos:

        cliente = documento.cliente

        if cliente.email:

            if documento.fecha_vencimiento < hoy:
                asunto = 'Documento vencido'
                mensaje = (
                f'Hola {Cliente.nombre},\n\n'
                f'Tu documento "{TipoDocumento.nombre_tipo}" '
                f'venció el {Documento.fecha_vencimiento}.'
            )
        else:
            asunto = 'Documento próximo a vencer'
            mensaje = (
            f'Hola {Cliente.nombre},\n\n'
            f'Tu documento "{TipoDocumento.nombre_tipo}" '
            f'vence el {Documento.fecha_vencimiento}.'
        )

        send_mail(
        subject=asunto,
        message=mensaje,
        from_email=settings.EMAIL_HOST_USER,
        recipient_list=[cliente.email],
        fail_silently=False,
        ) 
        enviados += 1

    return enviados