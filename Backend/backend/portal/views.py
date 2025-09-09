from rest_framework import generics, viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated,IsAdminUser
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.backends import TokenBackend
from django.contrib import messages
import re
from reportlab.lib.utils import ImageReader 
from datetime import datetime
from django.db.models import Q
from django.utils.timezone import now as tz_now
from itertools import groupby
from operator import attrgetter
import os
from itertools import groupby
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from io import BytesIO
from reportlab.lib.pagesizes import A3
from reportlab.lib.pagesizes import landscape, A3

from django.shortcuts import get_object_or_404
from .models import SeatPlan, SchoolApplicant
from django.db import transaction

import pandas as pd  
from django.shortcuts import render, redirect
from django.http import HttpResponse
from django.contrib.admin.views.decorators import staff_member_required  # Restrict view to admin/staff

from .models import SeatPlan  # Your SeatPlan model
from .forms import UploadFileForm  # A form for uploading Excel files


from .permissions import IsAdminOrReadOnly
from django.contrib.auth.models import User
from django.conf import settings

from .models import PortalPost, SubCategory, SchoolApplicant,SeatPlan
from .serializers import (
    PortalPostSerializer,
    SubCategorySerializer,
    SchoolApplicantSerializer,
    AdmitCardSerializer,
    SeatPlanSerializer
    
)

class PortalPostViewSet(viewsets.ModelViewSet):
    queryset = PortalPost.objects.all().order_by('-created_at')
    serializer_class = PortalPostSerializer

class SubCategoryViewSet(viewsets.ModelViewSet):
    queryset = SubCategory.objects.all()
    serializer_class = SubCategorySerializer

class SchoolApplicantViewSet(viewsets.ModelViewSet):
    queryset = SchoolApplicant.objects.all()
    serializer_class = SchoolApplicantSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(
            instance,
            data=request.data,
            context={'request': request},  # Make sure to pass request in context
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

class SchoolApplicantCreateView(generics.CreateAPIView):
    queryset = SchoolApplicant.objects.all()
    serializer_class = SchoolApplicantSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        subcategory_id = self.request.data.get('subcategory_id')
        serializer.save(
            student_name=self.request.user.username,
            email=self.request.user.email,
            user_id=self.request.user.id,
            subcategory_id=subcategory_id
        )

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data.update({
            'user_id': self.user.id,
            'username': self.user.username,
            'email': self.user.email,
        })
        return data

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

@api_view(['POST'])
def register_user(request):
    username = request.data.get('username')
    password = request.data.get('password')
    email = request.data.get('email')
    
    if not username or not password:
        return Response({'error': 'Username and password required.'}, status=400)

    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already exists.'}, status=400)

    user = User.objects.create_user(username=username, password=password, email=email)
    return Response({'message': 'User registered successfully'}, status=201)

@api_view(['GET'])
def get_subcategories_by_post(request, post_id):
    subcategories = SubCategory.objects.filter(post_id=post_id)
    serializer = SubCategorySerializer(subcategories, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_applications(request):
    try:
        # Get all applications for the current user
        applications = SchoolApplicant.objects.filter(
            student_name=request.user.username,
            email=request.user.email
        )
        if not applications.exists():
            return Response({"message": "No applications found."}, status=404)
            
        serializer = SchoolApplicantSerializer(applications, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(['PUT','PATCH'])
@permission_classes([IsAuthenticated])
def update_user_application(request, pk):
    try:
        applicant = SchoolApplicant.objects.get(
            pk=pk,
            student_name=request.user.username,
            email=request.user.email
        )
        # ❌ Block any update if already submitted
        if applicant.is_submit:
            return Response({"message": "This application has already been submitted. No further edits allowed."}, status=403)

        data = request.data.copy()
        # Process incoming data

        # ✅ Handle file fields if any
        if 'photo' in request.FILES:
            data['photo'] = request.FILES['photo']
        if 'signature' in request.FILES:
            data['signature'] = request.FILES['signature']

        # ✅ Check if the user is submitting
        is_submit_flag = data.get('is_submit', False)
        print("Is submit flag:", is_submit_flag)

        serializer = SchoolApplicantSerializer(
            applicant,
            data=data,
            partial=True,
            context={'request': request}
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        

        # if serializer.is_valid():
        #     serializer.save()

        #     print("Updating application for applicant:", is_submit_flag)
        #     # ✅ If submitting, lock it
        #     if is_submit_flag in ['true', 'True', True, 1, '1']:
        #         applicant.is_submit = True
        #         applicant.save(update_fields=['is_submit'])

        #     return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    except SchoolApplicant.DoesNotExist:
        return Response({"message": "Application not found or not owned by the user. Please ensure the application ID is correct and belongs to you."}, status=404)
    except Exception as e:
        return Response({
            "error": "An unexpected error occurred while updating the application.",
            "details": str(e),
            "suggestion": "Please check the data you provided and try again. If the issue persists, contact support."
        }, status=500)


  
@api_view(['GET'])
# @permission_classes([IsAuthenticated])
def generate_admit_card(request, subcategory_id):
    try:
        print("Generating admit card for subcategory:", subcategory_id)
        # Extract token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return Response({'error': 'No token provided'}, status=401)
        token = auth_header.split(' ')[1]

        # Decode token to get user id
        token_backend = TokenBackend(algorithm='HS256', signing_key=settings.SECRET_KEY)
        valid_data = token_backend.decode(token, verify=True)
        user_id = valid_data['user_id']
        # print("User ID from token:", user_id)
        # Get user email from user_id
        try:
            user = User.objects.get(id=user_id)
            user_email = user.email
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)

        # print("User email:", user_email)
        # Use email to get the applicant
        applicant = SchoolApplicant.objects.select_related(
            'subcategory__post'
        ).get(email=user_email, subcategory_id=subcategory_id)

        serializer = AdmitCardSerializer(applicant)
        return Response(serializer.data)
    except SchoolApplicant.DoesNotExist:
        return Response({'error': 'Application not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)




# Sit Plan views

class SeatPlanViewSet(viewsets.ModelViewSet):
    queryset = SeatPlan.objects.all()
    serializer_class = SeatPlanSerializer
    permission_classes = [IsAdminOrReadOnly]



@staff_member_required
def upload_seatplan(request):
    if request.method == "POST":
        form = UploadFileForm(request.POST, request.FILES)
        if form.is_valid():
            excel_file = request.FILES['file']
            df = pd.read_excel(excel_file)
            df.columns = df.columns.str.strip().str.lower()
            print(df.columns.tolist())  # Check what pandas sees

            required_columns = ['post_code', 'post_name', 'exam_center', 'building', 'floor', 'room_no', 'roll', 'exam_date_time']
            missing = [col for col in required_columns if col not in df.columns]
            if missing:
                return HttpResponse(f"Missing columns: {', '.join(missing)}", status=400)

            for _, row in df.iterrows():
                SeatPlan.objects.create(
                    post_code=row['post_code'],
                    post_name=row['post_name'],
                    exam_center=row['exam_center'],
                    building=row['building'],
                    floor=row['floor'],
                    room_no=row['room_no'],
                    roll=row['roll'],
                    exam_date_time=row['exam_date_time']
                )
            return redirect("upload_success")

    else:
        form = UploadFileForm()
    return render(request, "portal/upload_seatplan.html", {"form": form})



#Roll number generation view

@staff_member_required
def generate_rolls_view(request):
    """
    Generate roll numbers where first 3 characters are from subcategory's custom_id
    Format: <first-3-of-custom_id><sequence>, total length = 8 digits
    """
    subcategories = SubCategory.objects.filter(custom_id__isnull=False).order_by('id')

    if request.method == "POST":
        subcat_id = request.POST.get("subcategory_id")
        if not subcat_id:
            messages.error(request, "Please pick a subcategory.")
            return redirect("generate_rolls")

        try:
            subcat = SubCategory.objects.get(id=subcat_id, custom_id__isnull=False)
        except SubCategory.DoesNotExist:
            messages.error(request, "Invalid subcategory or missing custom_id.")
            return redirect("generate_rolls")

        # Get first 3 characters of custom_id
        prefix = str(subcat.custom_id)[:3].upper()  # Ensure uppercase
        if len(prefix) < 3:
            messages.error(request, "Custom ID must be at least 3 characters long.")
            return redirect("generate_rolls")

        width = 8 - len(prefix)  # Remaining digits after prefix
        if width <= 0:
            messages.error(request, "Custom ID is too long for 8-digit rolls.")
            return redirect("generate_rolls")

        # Find current max suffix for this subcategory
        existing_rolls = (SchoolApplicant.objects
                        .filter(subcategory=subcat, roll_number__isnull=False)
                        .values_list('roll_number', flat=True))

        current_max = 0
        for r in existing_rolls:
            if r.startswith(prefix):  # Only consider rolls with matching prefix
                suffix = r[len(prefix):]
                if suffix.isdigit():
                    current_max = max(current_max, int(suffix))

        # Assign rolls
        assigned_count = 0
        with transaction.atomic():
            to_assign = (SchoolApplicant.objects
                        .select_for_update(skip_locked=True)
                        .filter(subcategory=subcat, roll_number__isnull=True)
                        .order_by('id'))

            for app in to_assign:
                current_max += 1
                if current_max >= 10 ** width:
                    messages.error(request, f"Reached maximum rolls ({10**width}) for prefix {prefix}.")
                    break
                new_roll = f"{prefix}{current_max:0{width}d}"
                SchoolApplicant.objects.filter(pk=app.pk).update(roll_number=new_roll)
                assigned_count += 1

        if assigned_count:
            messages.success(
                request,
                f"Assigned {assigned_count} roll(s) with prefix '{prefix}' (format: {prefix}[1-{'9'*width}])"
            )
        else:
            messages.info(request, "No applicants needed roll numbers.")

        return redirect("generate_rolls")

    return render(request, "portal/generate_rolls.html", {"subcategories": subcategories})



@staff_member_required
def attendance_sheet_options(request):
    post_codes = (SeatPlan.objects.values_list('post_code', flat=True)
                  .distinct().order_by('post_code'))
    centers = (SeatPlan.objects.values_list('exam_center', flat=True)
               .distinct().order_by('exam_center'))
    subcategories = SubCategory.objects.all().order_by('name')
    return render(request, "portal/attendence_options.html", {
        "post_codes": post_codes,
        "centers": centers,
        "subcategories": subcategories,
    })






# --- ADD THESE HELPERS ABOVE THE VIEW --------------------------------------
def _seat_name(seat):
    """
    Read the candidate's name directly from SeatPlan.
    Add/adjust keys here to match your SeatPlan columns.
    """
    for attr in ("candidate_name", "name", "student_name"):
        val = getattr(seat, attr, None)
        if val:
            return str(val)
    return "N/A"

def _seat_category(seat):
    """
    Read the category directly from SeatPlan.
    Uses typical columns found in uploaded seatplan files.
    """
    for attr in ("category", "post_name", "post_code", "sub_category", "post"):
        val = getattr(seat, attr, None)
        if val:
            return str(val)
    return "N/A"
# ---------------------------------------------------------------------------


@staff_member_required
def generate_attendance_from_seatplan(request):
    """
    Generate attendance PDF grouped by center/building/floor/room.
    Shows all seat rows. For each row, if SeatPlan.post_code matches
    SubCategory.custom_id and SeatPlan.roll matches SchoolApplicant.roll_number,
    fill Name/Roll/Photo/Signature; otherwise leave blank.
    Includes a Post column from SeatPlan (post_name -> post_code fallback).
    """
    post_code_filter = (request.GET.get('post_code') or '').strip()
    subcat_filter = (request.GET.get('subcategory_id') or '').strip()
    center_filter = (request.GET.get('center') or '').strip()
    custom_center_filter = (request.GET.get('custom_center') or '').strip()
    action_flag = (request.GET.get('action') or request.GET.get('all') or '').strip().lower()

    # Handle center filtering logic
    selected_center = None
    if center_filter and center_filter != 'custom':
        selected_center = center_filter
    elif center_filter == 'custom' and custom_center_filter:
        selected_center = custom_center_filter

    # If no filters provided and no explicit generate-all flag, show the options page
    if not post_code_filter and not subcat_filter and not selected_center and action_flag not in ('1', 'true', 'go', 'generate', 'all'):
        post_codes = (SeatPlan.objects.values_list('post_code', flat=True)
                      .distinct().order_by('post_code'))
        centers = (SeatPlan.objects.values_list('exam_center', flat=True)
                   .distinct().order_by('exam_center'))
        subcategories = SubCategory.objects.all().order_by('name')
        return render(request, "portal/attendence_options.html", {
            "post_codes": post_codes,
            "centers": centers,
            "subcategories": subcategories,
            "selected_center": selected_center,
            "selected_custom_center": custom_center_filter if center_filter == 'custom' else None,
        })

    # 1) SeatPlan rows with filters
    seat_plans = SeatPlan.objects.all()
    if post_code_filter:
        seat_plans = seat_plans.filter(post_code__iexact=post_code_filter)
    if selected_center:
        seat_plans = seat_plans.filter(exam_center__icontains=selected_center)
    
    seat_plans = seat_plans.order_by('exam_center', 'building', 'floor', 'room_no', 'id')
    if not seat_plans.exists():
        return HttpResponse("No SeatPlan data found for the selected filters.", content_type="text/plain", status=404)

    # If a specific subcategory is provided, fetch it to narrow matching
    subcat_obj = None
    if subcat_filter.isdigit():
        try:
            subcat_obj = SubCategory.objects.get(id=int(subcat_filter))
        except SubCategory.DoesNotExist:
            subcat_obj = None

    # Build a fast lookup map of applicants by (CUSTOM_ID only, uppercased)
    apps_qs = SchoolApplicant.objects.select_related('subcategory')
    if subcat_obj:
        apps_qs = apps_qs.filter(subcategory=subcat_obj)

    applicants_by_code = {}
    for a in apps_qs:
        code_key = ((getattr(a.subcategory, 'custom_id', '') or '').strip().upper())
        if not code_key:
            continue
        applicants_by_code.setdefault(code_key, []).append(a)

    # Sort each code bucket by roll_number then id for stable assignment
    for code_key, lst in applicants_by_code.items():
        lst.sort(key=lambda x: ((x.roll_number or ''), x.id))

    # Track how many applicants consumed per code as we traverse seat rows
    consumed_idx = {}

    # 4) PDF setup
    response = HttpResponse(content_type='application/pdf')
    center_name = selected_center or "All_Centers"
    response['Content-Disposition'] = f'attachment; filename=attendance_sheets_{center_name}.pdf'

    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=landscape(A3))
    PAGE_W, PAGE_H = landscape(A3)

    # --- Layout constants ---
    LM, RM = 0.35 * inch, 0.35 * inch
    TM, BM = 0.60 * inch, 0.60 * inch
    CELL_PAD = 4

    CONTENT_W = PAGE_W - LM - RM
    HEADER_H  = 1.8 * inch  # Increased for roll range

    ROW_H = 1.05 * inch
    IMAGE_TARGET_H = ROW_H - 0.30 * inch

    # Compute rows per page once
    usable_h = PAGE_H - TM - BM - HEADER_H
    rows_per_page = max(1, int(usable_h // ROW_H))

    # Fixed columns: S.No, Post, Roll No, Name, Photo, Signature, Present
    COLS = [
        {"label": "S.No", "key": "serial", "weight": 0.7},
        {"label": "Post", "key": "post", "weight": 3.0},
        {"label": "Roll No", "key": "roll", "weight": 1.6},
        {"label": "Name", "key": "name", "weight": 3.2},
        {"label": "Photo", "key": "photo", "weight": 1.4},
        {"label": "Signature", "key": "signature", "weight": 1.4},
        {"label": "Present", "key": "present", "weight": 0.9},
    ]
    total_w = sum(col["weight"] for col in COLS)
    for col in COLS:
        col["width"] = CONTENT_W * (col["weight"] / max(total_w, 1e-6))

    def _image_path(filefield):
        if not filefield:
            return None
        try:
            path = getattr(filefield, "path", None) or os.path.join(settings.MEDIA_ROOT, getattr(filefield, 'name', ''))
            return path if path and os.path.exists(path) else None
        except Exception:
            return None

    def get_roll_range(room_rows, current_consumed_idx):
        """Calculate roll range for students in a room"""
        rolls = []
        temp_consumed = current_consumed_idx.copy()
        
        for seat_row in room_rows:
            code_key = ((seat_row.post_code or '').strip().upper())
            lst = applicants_by_code.get(code_key, [])
            idx = temp_consumed.get(code_key, 0)
            if idx < len(lst):
                applicant = lst[idx]
                if applicant and applicant.roll_number:
                    rolls.append(applicant.roll_number)
                temp_consumed[code_key] = idx + 1
        
        if rolls:
            rolls.sort()
            return f"{rolls[0]} to {rolls[-1]}"
        return "No rolls assigned"

    def draw_header(center, bldg, flr, room, post_label, code_label, exam_time, roll_range):
        y = PAGE_H - TM
        c.setFont("Helvetica-Bold", 13)
        c.drawString(LM, y, f"Center: {center or 'N/A'}")
        c.setFont("Helvetica", 11)
        c.drawRightString(PAGE_W - RM, y, f"Building: {bldg or 'N/A'} | Floor: {flr or 'N/A'} | Room: {room or 'N/A'}")

        y -= 0.32 * inch
        c.setFont("Helvetica-Bold", 12)
        c.drawString(LM, y, f"Post: {post_label}")
        c.setFont("Helvetica", 11)
        c.drawRightString(PAGE_W - RM, y, f"Code: {code_label} | Exam: {exam_time or 'N/A'}")

        # Add roll range information
        y -= 0.28 * inch
        c.setFont("Helvetica-Bold", 11)
        c.drawCentredString(PAGE_W / 2, y, f"Roll Range: {roll_range}")

        y -= 0.32 * inch
        c.setFont("Helvetica-Bold", 16)
        c.drawCentredString(PAGE_W / 2, y, "ATTENDANCE SHEET")

        y -= 0.28 * inch
        c.setFont("Helvetica", 11)
        c.drawString(LM, y, "Date: " + tz_now().strftime("%d-%b-%Y"))

        y -= 0.36 * inch
        c.setFont("Helvetica-Bold", 11)
        x = LM
        for col in COLS:
            c.rect(x, y - 0.24 * inch, col["width"], 0.38 * inch, fill=1, stroke=0)
            c.setFillColorRGB(1, 1, 1)
            c.drawCentredString(x + col["width"] / 2, y - 0.07 * inch, col["label"])
            c.setFillColorRGB(0, 0, 0)
            x += col["width"]
        return y - 0.45 * inch

    def draw_image_cell(filefield, x, y_bottom, w, h_row):
        c.rect(x, y_bottom, w, h_row)
        inner_x, inner_y = x + 2, y_bottom + 2
        inner_w, inner_h = w - 4, h_row - 4
        p = _image_path(filefield)
        if p:
            try:
                img = ImageReader(p)
                iw, ih = img.getSize()
                if ih > 0:
                    target_h = min(IMAGE_TARGET_H, inner_h)
                    scale = target_h / ih
                    draw_w = min(inner_w, iw * scale)
                    draw_h = min(inner_h, ih * scale)
                    dx = inner_x + (inner_w - draw_w) / 2
                    dy = y_bottom + (h_row - draw_h) / 2
                    c.drawImage(img, dx, dy, width=draw_w, height=draw_h, preserveAspectRatio=True, mask='auto')
                    return
            except Exception:
                pass
        # leave blank if no image

    def draw_checkbox_cell(x, y_bottom, w, h_row):
        c.rect(x, y_bottom, w, h_row)
        side = min(0.38 * inch, w - 6, h_row - 6)
        bx, by = x + (w - side)/2, y_bottom + (h_row - side)/2
        c.rect(bx, by, side, side)
        c.setFillColorRGB(0.95, 0.95, 0.95)
        c.rect(bx + 1, by + 1, side - 2, side - 2, fill=1, stroke=0)
        c.setFillColorRGB(0, 0, 0)

    def draw_text_cell(text, x, y_bottom, w, h_row, font="Helvetica", size=10, align="left", pad=CELL_PAD):
        c.setFont(font, size)
        s = "" if text is None else str(text)
        if align == "center":
            c.drawCentredString(x + w/2, y_bottom + h_row/2 - size/2, s)
        elif align == "right":
            c.drawRightString(x + w - pad, y_bottom + h_row/2 - size/2, s)
        else:
            c.drawString(x + pad, y_bottom + h_row/2 - size/2, s)

    def draw_row(i, seat_row, applicant, y_bottom):
        row_h = ROW_H
        if i % 2 == 0:
            c.setFillColorRGB(0.965, 0.965, 0.965)
            c.rect(LM, y_bottom, CONTENT_W, row_h, fill=1, stroke=0)
            c.setFillColorRGB(0, 0, 0)

        x = LM
        for col in COLS:
            key = col["key"]
            w = col["width"]
            if key == 'serial':
                c.rect(x, y_bottom, w, row_h)
                draw_text_cell(i, x, y_bottom, w, row_h, align="center")
            elif key == 'present':
                draw_checkbox_cell(x, y_bottom, w, row_h)
            elif key == 'post':
                c.rect(x, y_bottom, w, row_h)
                post_text = getattr(seat_row, 'post_name', None) or getattr(seat_row, 'post_code', '')
                draw_text_cell(post_text, x, y_bottom, w, row_h)
            elif key == 'roll':
                c.rect(x, y_bottom, w, row_h)
                roll_text = (getattr(applicant, 'roll_number', '') if applicant else '')
                draw_text_cell(roll_text, x, y_bottom, w, row_h, align="center")
            elif key == 'name':
                c.rect(x, y_bottom, w, row_h)
                name_text = getattr(applicant, 'student_name', '') if applicant else ''
                draw_text_cell(name_text, x, y_bottom, w, row_h)
            elif key == 'photo':
                draw_image_cell(getattr(applicant, 'photo', None) if applicant else None, x, y_bottom, w, row_h)
            elif key == 'signature':
                draw_image_cell(getattr(applicant, 'signature', None) if applicant else None, x, y_bottom, w, row_h)
            x += w
        return row_h

    def key_tuple(seat):
        return (seat.exam_center, seat.building, seat.floor, seat.room_no)

    # Render room-wise over actual SeatPlan rows
    page_started = False
    for (center, bldg, flr, room), group in groupby(seat_plans, key=lambda s: key_tuple(s)):
        rows = list(group)
        # Determine labels for header (handle multiple posts in room)
        post_names = list({(r.post_name or '').strip() for r in rows if (r.post_name or '').strip()})
        codes = list({(r.post_code or '').strip() for r in rows if (r.post_code or '').strip()})
        post_label = post_names[0] if len(post_names) == 1 else 'Multiple'
        code_label = codes[0] if len(codes) == 1 else 'Multiple'
        exam_time = rows[0].exam_date_time if rows else ''

        # Calculate roll range for this room using current consumed state
        roll_range = get_roll_range(rows, consumed_idx)

        if page_started:
            c.showPage()
        page_started = True
        room_page = 1
        y = draw_header(center, bldg, flr, room, post_label, code_label, exam_time, roll_range)

        used = 0
        serial = 0
        for seat_row in rows:
            # Assign next applicant for this post_code (case-insensitive)
            code_key = ((seat_row.post_code or '').strip().upper())
            lst = applicants_by_code.get(code_key, [])
            idx = consumed_idx.get(code_key, 0)
            applicant = lst[idx] if idx < len(lst) else None
            if applicant is not None:
                consumed_idx[code_key] = idx + 1

            if used >= rows_per_page:
                c.setFont("Helvetica", 9)
                c.drawCentredString(PAGE_W / 2, 0.5 * inch, f"Page {room_page}")
                c.showPage()
                room_page += 1
                y = draw_header(center, bldg, flr, room, post_label, code_label, exam_time, roll_range)
                used = 0
            serial += 1
            row_h = draw_row(serial, seat_row, applicant, y - ROW_H)
            y -= row_h
            used += 1
        # Footer for the last page of this room
        c.setFont("Helvetica", 9)
        c.drawCentredString(PAGE_W / 2, 0.5 * inch, f"Page {room_page}")

    c.save()
    pdf = buffer.getvalue()
    buffer.close()
    response.write(pdf)
    return response


