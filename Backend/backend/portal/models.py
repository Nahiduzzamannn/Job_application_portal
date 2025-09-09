from django.db import models
import random
from django.contrib.auth.models import User
import uuid

# Admin-posted circulars
class PortalPost(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True) 
    CATEGORY_CHOICES = [
        ('admission', 'Admission'),
        ('job', 'Job'),
    ]




    title = models.CharField(max_length=200)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

# models.py

class SubCategory(models.Model):
    custom_id = models.CharField(
        max_length=50,
        unique=True,
        verbose_name="Custom Job ID",
        help_text="Enter a unique ID for this job (e.g., JOB-001)",
        null=True,
        blank=True
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)  # 🔹 Added user reference
    post = models.ForeignKey(PortalPost, related_name='subcategories', on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    application_fee = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)  # 💰 New field

    def __str__(self):
        return f"{self.name} ({self.post.title})"


# School application linked to subcategory
class SchoolApplicant(models.Model):
    GENDER_CHOICES = [
        ('Male', 'Male'),
        ('Female', 'Female'),
        ('Other', 'Other'),
    ]

    applicant_number = models.CharField(max_length=50, unique=True, blank=True)
    roll_number = models.CharField(max_length=20, blank=True, null=True)

    is_submit = models.BooleanField(default=False) 

    # Link to which subcategory post this applies to (e.g., Class 6 of "Admission 2025")
    subcategory = models.ForeignKey(SubCategory, on_delete=models.SET_NULL, null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)

    student_name = models.CharField(max_length=100)
    dob = models.DateField()
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    student_class = models.CharField(max_length=20)

    father_name = models.CharField(max_length=100)
    mother_name = models.CharField(max_length=100)
    contact = models.CharField(max_length=20)
    email = models.EmailField(blank=True, null=True)

    previous_school = models.CharField(max_length=255, blank=True)
    reason = models.TextField(blank=True)

    present_address = models.TextField(null=True, blank=True)
    permanent_address = models.TextField(null=True, blank=True)

    photo = models.ImageField(upload_to='applicant_photos/', null=True, blank=True)
    signature = models.ImageField(upload_to='applicant_signatures/', null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.applicant_number:
            # Generate a unique six-digit random integer as applicant number
            self.applicant_number = self.generate_unique_applicant_number()
        # Prevent updates if is_submit is True, unless setting is_submit to True for the first time
        if self.pk:
            orig = SchoolApplicant.objects.get(pk=self.pk)
            if orig.is_submit and not (not orig.is_submit and self.is_submit):
                # Only allow if is_submit is being set to True from False
                raise Exception("This application has already been submitted. No further edits allowed.")
        super().save(*args, **kwargs)

    @classmethod
    def generate_unique_applicant_number(cls):
        while True:
            number = str(random.randint(1, 999999)).zfill(6)
            if not cls.objects.filter(applicant_number=number).exists():
                return number

    def __str__(self):
        return f"{self.student_name} (App#: {self.applicant_number})"



#Sit plan



class SeatPlan(models.Model):
    post_code = models.CharField(max_length=10)
    post_name = models.CharField(max_length=1000)
    exam_center = models.TextField()
    building = models.CharField(max_length=50)
    floor = models.CharField(max_length=50)
    room_no = models.CharField(max_length=50)
    # start_roll = models.CharField(max_length=20)
    # end_roll = models.CharField(max_length=20)
    exam_date_time = models.CharField(max_length=100) 
    roll = models.CharField(max_length=20, null=True, blank=True)
     # or DateTimeField if parsed

    def __str__(self):
        return f"{self.post_name} - {self.room_no}"