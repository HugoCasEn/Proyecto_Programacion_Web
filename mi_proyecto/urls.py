from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from django.conf import settings
from gestion_clientes.views import verificar_documentos
# ESTA ES LA RUTA CORRECTA QUE NO DEBE FALLAR:
from django.conf.urls.static import static 
from gestion_clientes.views import (
    ClienteViewSet, DocumentoViewSet, ReporteGeneradoViewSet, 
    TipoDocumentoViewSet, EstadoViewSet
)

router = DefaultRouter()
router.register(r'clientes', ClienteViewSet)
router.register(r'documentos', DocumentoViewSet)
router.register(r'reportes', ReporteGeneradoViewSet)
router.register(r'tipos', TipoDocumentoViewSet)
router.register(r'estados', EstadoViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/verificar-documentos/', verificar_documentos),
]

# Servir archivos media (PDFs) durante el desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)