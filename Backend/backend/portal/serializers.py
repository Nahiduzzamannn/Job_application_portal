from rest_framework import serializers
from .models import PortalPost, SubCategory, SchoolApplicant,SeatPlan

# -------------------------------
# 🔷 Admin Part Serializers
# -------------------------------

class SubCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SubCategory
        fields = ['id', 'name', 'post', 'application_fee']

class PortalPostSerializer(serializers.ModelSerializer):
    subcategories = SubCategorySerializer(many=True, read_only=True)

    class Meta:
        model = PortalPost
        fields = ['id', 'title', 'category', 'description', 'created_at', 'subcategories']


# serializers.py

from .models import SchoolApplicant, SeatPlan

class AdmitCardSerializer(serializers.ModelSerializer):
    subcategory_name = serializers.CharField(source='subcategory.name')
    post_title = serializers.CharField(source='subcategory.post.title')
    seat_plan = serializers.SerializerMethodField()

    class Meta:
        model = SchoolApplicant
        fields = [
            'student_name', 'father_name', 'mother_name', 'gender',
            'dob', 'student_class', 'applicant_number', 'roll_number',
            'subcategory_name', 'post_title', 'photo', 'signature',
            'seat_plan'
        ]

    def get_seat_plan(self, obj):
        try:
            seat = SeatPlan.objects.get(roll=obj.roll_number)
            return {
                "post_code": seat.post_code,
                "post_name": seat.post_name,
                "exam_center": seat.exam_center,
                "building": seat.building,
                "floor": seat.floor,
                "room_no": seat.room_no,
                "exam_date_time": seat.exam_date_time,
                "roll": seat.roll
            }
        except SeatPlan.DoesNotExist:
            return None


class SchoolApplicantSerializer(serializers.ModelSerializer):
    subcategory_detail = SubCategorySerializer(source='subcategory', read_only=True)

    class Meta:
        model = SchoolApplicant
        fields = '__all__'
        read_only_fields = ('user', 'applicant_number', 'created_at', 'updated_at','student_name','email')
        extra_kwargs = {
            'photo': {'required': False, 'allow_null': True},
            'signature': {'required': False, 'allow_null': True}
        }

    def validate_photo(self, value):
        if value:
            if value.size > 1 * 1024 * 1024:
                raise serializers.ValidationError("Photo size should not exceed 1MB.")
            if not value.content_type.startswith('image/'):
                raise serializers.ValidationError("Only image files are allowed for photo.")
        return value

    def validate_signature(self, value):
        if value:
            if value.size > 500 * 1024:
                raise serializers.ValidationError("Signature size should not exceed 500KB.")
            if not value.content_type.startswith('image/'):
                raise serializers.ValidationError("Only image files are allowed for signature.")
        return value

    def to_internal_value(self, data):
        ret = super().to_internal_value(data)
        request = self.context.get('request')
        if request is not None and hasattr(request, 'FILES'):
            files = request.FILES
            if 'photo' in files and files['photo']:
                ret['photo'] = files['photo']
            if 'signature' in files and files['signature']:
                ret['signature'] = files['signature']
        return ret

    def update(self, instance, validated_data):
        if instance.is_submit:
            raise serializers.ValidationError("Cannot update a submitted application.")

        if 'photo' not in validated_data:
            validated_data.pop('photo', None)
        if 'signature' not in validated_data:
            validated_data.pop('signature', None)

        return super().update(instance, validated_data)

    def create(self, validated_data):
        validated_data['is_submit'] = False
        return super().create(validated_data)


#Sit Plan Serializer
class SeatPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SeatPlan
        fields = '__all__'

