-- Add INSERT/UPDATE/DELETE policies for plans table
CREATE POLICY "Allow public insert on plans" ON public.plans FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on plans" ON public.plans FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on plans" ON public.plans FOR DELETE USING (true);

-- Add INSERT/UPDATE/DELETE policies for marketing_stats table
CREATE POLICY "Allow public insert on marketing_stats" ON public.marketing_stats FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on marketing_stats" ON public.marketing_stats FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on marketing_stats" ON public.marketing_stats FOR DELETE USING (true);

-- Add INSERT/UPDATE/DELETE policies for budget table
CREATE POLICY "Allow public insert on budget" ON public.budget FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on budget" ON public.budget FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on budget" ON public.budget FOR DELETE USING (true);

-- Add INSERT/UPDATE/DELETE policies for transactions table
CREATE POLICY "Allow public insert on transactions" ON public.transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on transactions" ON public.transactions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on transactions" ON public.transactions FOR DELETE USING (true);