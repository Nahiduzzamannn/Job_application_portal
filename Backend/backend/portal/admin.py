from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import PortalPost, SubCategory,SeatPlan, SchoolApplicant

class SubCategoryInline(admin.TabularInline):
    model = SubCategory
    extra = 1
    fields = ('custom_id', 'name', 'application_fee') 

class PortalPostAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'created_at']
    inlines = [SubCategoryInline]

admin.site.register(PortalPost, PortalPostAdmin)
admin.site.register(SchoolApplicant)




@admin.register(SeatPlan)
class SeatPlanAdmin(admin.ModelAdmin):
    list_display = ('post_code', 'post_name', 'exam_center', 'building', 'floor', 'room_no', 'roll', 'exam_date_time')
    search_fields = ('post_name', 'exam_center', 'roll')
    list_filter = ('exam_center', 'building', 'floor')