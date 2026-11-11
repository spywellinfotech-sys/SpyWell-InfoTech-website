update public.studio_templates set config = config || '{"style":"Royal","layout":"double","ornament":"❖"}'::jsonb where id='inv-1';
update public.studio_templates set config = config || '{"style":"Luxury","layout":"double","ornament":"✦"}'::jsonb where id='inv-2';
update public.studio_templates set config = config || '{"style":"Modern","layout":"plain","ornament":""}'::jsonb where id='inv-3';
update public.studio_templates set config = config || '{"style":"Floral","layout":"arch","ornament":"✿"}'::jsonb where id='inv-4';
update public.studio_templates set config = config || '{"style":"Religious","layout":"frame","ornament":"॥"}'::jsonb where id='inv-5';
insert into public.studio_templates(id,product_type,name,description,config,sort) values
 ('inv-6','invitation','Clean Minimal','White and black, simple','{"style":"Minimal","layout":"plain","ornament":"","palette":{"bg":"#ffffff","fg":"#222222","ac":"#111111"},"font":"poppins","nameFont":"playfair"}',6),
 ('inv-7','invitation','Shubh Vivah','Red and gold traditional','{"style":"Traditional Indian","layout":"arch","ornament":"❁","palette":{"bg":"#7a0c16","fg":"#fde9b8","ac":"#f2c14e"},"font":"tiro","nameFont":"yatra"}',7)
on conflict (id) do nothing;
update public.studio_templates set config = config || '{"style":"Corporate","layout":"band"}'::jsonb where id='vc-1';
update public.studio_templates set config = config || '{"style":"Professional","layout":"band"}'::jsonb where id='vc-2';
update public.studio_templates set config = config || '{"style":"Business","layout":"wave"}'::jsonb where id='vc-3';
update public.studio_templates set config = config || '{"style":"Business","layout":"band"}'::jsonb where id='vc-4';
insert into public.studio_templates(id,product_type,name,description,config,sort) values
 ('vc-5','visiting','Slate Minimal','Left aligned, quiet','{"style":"Minimal","layout":"side","palette":{"bg":"#ffffff","fg":"#1f2933","ac":"#334155"},"font":"poppins","nameFont":"poppins"}',5),
 ('vc-6','visiting','Violet Modern','Bold modern','{"style":"Modern","layout":"wave","palette":{"bg":"#f7f5ff","fg":"#221a3d","ac":"#6d28d9"},"font":"poppins","nameFont":"poppins"}',6),
 ('vc-7','visiting','Coral Creative','Friendly and bright','{"style":"Creative","layout":"side","palette":{"bg":"#fff7f3","fg":"#3a1f18","ac":"#e4572e"},"font":"mukta","nameFont":"yatra"}',7)
on conflict (id) do nothing;
