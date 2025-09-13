from django.db import migrations, models
import django.db.models.deletion
from django.utils.text import slugify


def forwards(apps, schema_editor):
    PortalPost = apps.get_model('portal', 'PortalPost')
    Category = apps.get_model('portal', 'Category')
    # Build categories from existing text field 'category'
    distinct_vals = (
        PortalPost.objects.order_by()
        .values_list('category', flat=True)
        .distinct()
    )
    mapping = {}
    for val in distinct_vals:
        if not val:
            continue
        name = str(val).strip()
        if not name:
            continue
        slug = slugify(name)
        cat, _ = Category.objects.get_or_create(name=name, defaults={'slug': slug})
        mapping[name] = cat.id
    for post in PortalPost.objects.all():
        old = (post.category or '').strip()
        cat_id = mapping.get(old)
        if cat_id:
            PortalPost.objects.filter(pk=post.pk).update(category_fk_id=cat_id)


def backwards(apps, schema_editor):
    PortalPost = apps.get_model('portal', 'PortalPost')
    for post in PortalPost.objects.select_related('category_fk').all():
        name = getattr(post.category_fk, 'name', None)
        if name:
            PortalPost.objects.filter(pk=post.pk).update(category=name)


class Migration(migrations.Migration):

    dependencies = [
        ('portal', '0014_delete_categorychoice_alter_portalpost_category'),
    ]

    operations = [
        # Create new Category model
        migrations.CreateModel(
            name='Category',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True)),
                ('slug', models.SlugField(max_length=120, unique=True)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={'ordering': ['name']},
        ),
        # Add temporary FK field
        migrations.AddField(
            model_name='portalpost',
            name='category_fk',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='posts_temp', to='portal.category'),
        ),
        # Populate FK from old text values
        migrations.RunPython(forwards, backwards),
        # Remove old text field
        migrations.RemoveField(
            model_name='portalpost',
            name='category',
        ),
        # Rename FK field to final name
        migrations.RenameField(
            model_name='portalpost',
            old_name='category_fk',
            new_name='category',
        ),
        # Adjust related_name after rename (no-op for schema, just state) by altering field
        migrations.AlterField(
            model_name='portalpost',
            name='category',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='posts', to='portal.category'),
        ),
    ]
