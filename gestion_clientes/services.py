from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from datetime import timedelta

from .models import Documento

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

            send_mail(
                subject='Documento próximo a vencer',
                message=(
                    f'Hola {cliente.nombre},\n\n'
                    f'Tu documento "{documento.tipo}" '
                    f'vence el {documento.fecha_vencimiento}.'
                ),
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[cliente.email],
                fail_silently=False,
            )

            enviados += 1

    return enviados