from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView  # Add this import
from portal import views
from django.shortcuts import render
from .views import (
    SchoolApplicantCreateView,
    PortalPostViewSet,
    SubCategoryViewSet,
    register_user,
    MyTokenObtainPairView,
    get_subcategories_by_post,
    get_user_applications,
    update_user_application,
    generate_admit_card,
    SeatPlanViewSet,
    upload_seatplan,
    generate_rolls_view,

    attendance_sheet_options,
   
    generate_attendance_from_seatplan,
    
    
)
from django.conf import settings
from django.conf.urls.static import static

router = DefaultRouter()
router.register(r'posts', PortalPostViewSet)
router.register(r'subcategories', SubCategoryViewSet)
router.register(r'seatplans', SeatPlanViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('register/', register_user, name='register'),
    path('login/', MyTokenObtainPairView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),  # Add this line
    path('apply/', SchoolApplicantCreateView.as_view(), name='apply'),
    path('posts/<int:post_id>/subcategories/', get_subcategories_by_post, name='subcategories-by-post'),
    path('my-applications/', get_user_applications, name='my-applications'),
    path('update-application/<int:pk>/', update_user_application, name='update-application'),

     path('admit-card/<int:subcategory_id>/', generate_admit_card),
    
    path("upload-seatplan/", views.upload_seatplan, name="upload_seatplan"),
    path("upload-success/", lambda request: render(request, "portal/upload_success.html"), name="upload_success"),
    path("admin-tools/generate-rolls/", generate_rolls_view, name="generate_rolls"),

    path('attendance-sheet/', attendance_sheet_options, name='attendance_options'),
    path('attendance-sheet/generate/', views.generate_attendance_from_seatplan, name='generate_room_attendance'),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
