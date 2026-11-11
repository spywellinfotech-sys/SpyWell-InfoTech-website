update public.studio_templates set name='Royal Wine', description='Cream and wine classic', config='{"legacy_tpl":1,"palette":{"bg":"#fdf6e8","fg":"#2b1a14","ac":"#8b1a2b"},"font":"hind","nameFont":"vibes"}' where id='inv-1';
update public.studio_templates set description='Deep green with gold', config='{"legacy_tpl":2,"palette":{"bg":"#0f3d2e","fg":"#f6ecd0","ac":"#d4af37"},"font":"poppins","nameFont":"playfair"}' where id='inv-2';
update public.studio_templates set description='Navy with gold', config='{"legacy_tpl":3,"palette":{"bg":"#101d3d","fg":"#f3ead2","ac":"#d9b24c"},"font":"poppins","nameFont":"vibes"}' where id='inv-3';
update public.studio_templates set description='Soft pink', config='{"legacy_tpl":4,"palette":{"bg":"#fff0f3","fg":"#4a1d2c","ac":"#c2185b"},"font":"hind","nameFont":"playfair"}' where id='inv-4';
update public.studio_templates set description='Warm saffron', config='{"legacy_tpl":5,"palette":{"bg":"#fff6e5","fg":"#3b2207","ac":"#e07a00"},"font":"tiro","nameFont":"tiro"}' where id='inv-5';
insert into public.studio_templates(id,product_type,name,description,config,sort) values
 ('vc-1','visiting','Classic Blue','Clean professional','{"palette":{"bg":"#ffffff","fg":"#1b2430","ac":"#1a56db"},"font":"poppins","nameFont":"poppins"}',1),
 ('vc-2','visiting','Charcoal Gold','Premium dark','{"palette":{"bg":"#1c1c1e","fg":"#f2efe6","ac":"#c9a227"},"font":"poppins","nameFont":"playfair"}',2),
 ('vc-3','visiting','Fresh Green','Shops and services','{"palette":{"bg":"#f4fbf6","fg":"#17301f","ac":"#1b8a4b"},"font":"hind","nameFont":"hind"}',3),
 ('vc-4','visiting','Wine Cream','SpyWell style','{"palette":{"bg":"#fdf6e8","fg":"#2b1a14","ac":"#8b1a2b"},"font":"hind","nameFont":"playfair"}',4)
on conflict (id) do nothing;
