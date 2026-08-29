import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Building2, UserRound, Lock, Mail, BadgeCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { registerSchema, organisationRegisterSchema } from '@/utils/validators';
import { extractErrorMessage } from '@/utils/errorHandler';
import { Button, Input, Alert } from '@/components/ui';

const inputClass = '!bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 !rounded-xl shadow-sm';
const passwordTests = [(v) => v.length >= 8, (v) => /[A-Z]/.test(v), (v) => /\d/.test(v), (v) => /[^A-Za-z0-9]/.test(v)];

function PasswordStrength({ value = '' }) {
  const { t } = useTranslation();
  const score = passwordTests.filter((test) => test(value)).length;
  if (!value) return null;
  const strengthLabels = [
    t('registerPage.weak', { defaultValue: 'Weak' }),
    t('registerPage.weak', { defaultValue: 'Weak' }),
    t('registerPage.fair', { defaultValue: 'Fair' }),
    t('registerPage.good', { defaultValue: 'Good' }),
    t('registerPage.strong', { defaultValue: 'Strong' }),
  ];
  return <div className="mt-2" aria-live="polite">
    <div className="flex gap-1">{[1,2,3,4].map((n) => <span key={n} className={`h-1.5 flex-1 rounded ${n <= score ? 'bg-[#7FBF8C]' : 'bg-slate-700'}`} />)}</div>
    <p className="mt-1 text-xs text-[#9FAFA5]">{t('registerPage.passwordStrength', { level: strengthLabels[score], defaultValue: `Password strength: ${strengthLabels[score]}` })}</p>
  </div>;
}

function Terms({ register, error }) {
  const { t } = useTranslation();
  return <div><label className="flex gap-3 text-sm text-[#C8D3CB]">
    <input type="checkbox" className="mt-1" {...register('acceptTerms')} />
    <span>{t('registerPage.acceptTerms', { defaultValue: 'I accept the' })} <Link className="text-[#7FBF8C]" to="#">{t('registerPage.terms', { defaultValue: 'Terms' })}</Link> {t('registerPage.and', { defaultValue: 'and' })} <Link className="text-[#7FBF8C]" to="#">{t('registerPage.privacyPolicy', { defaultValue: 'Privacy Policy' })}</Link>.</span>
  </label>{error && <p className="form-error mt-1">{error.message}</p>}</div>;
}

function IndividualForm() {
  const { t } = useTranslation();
  const { register: createAccount } = useAuth();
  const navigate = useNavigate();
  const [organisations, setOrganisations] = useState([]);

  useEffect(() => {
    fetch('/api/organisations/public')
      .then(res => res.json())
      .then(data => setOrganisations(data || []))
      .catch(err => console.error('Failed to load organisations', err));
  }, []);

  const form = useForm({ 
    resolver: zodResolver(registerSchema), 
    defaultValues: { fullName: '', username: '', email: '', password: '', confirmPassword: '', acceptTerms: false, organisationId: '' } 
  });
  const { register, handleSubmit, watch, setError, formState: { errors, isSubmitting } } = form;

  const submit = async (data) => {
    try {
      await createAccount({ 
        fullName: data.fullName, 
        username: data.username, 
        email: data.email, 
        password: data.password,
        organisationId: data.organisationId ? Number(data.organisationId) : null
      });
      toast.success(t('registerPage.individualTitle', { defaultValue: 'Your individual account has been created successfully.' }));
      navigate('/', { replace: true });
    } catch (error) { setError('root', { message: extractErrorMessage(error) }); }
  };

  return <form onSubmit={handleSubmit(submit)} className="space-y-5" noValidate>
    <div>
      <h2 className="text-xl font-bold">{t('registerPage.individualTitle', { defaultValue: 'Individual User Details' })}</h2>
      <p className="mt-1 text-sm text-[#9FAFA5]">{t('registerPage.individualSubtitle', { defaultValue: 'Enter your details using the example format shown in each field.' })}</p>
    </div>
    {errors.root && <Alert variant="error">{errors.root.message}</Alert>}
    <div className="grid sm:grid-cols-2 gap-4">
      <Input label={t('registerPage.fullName', { defaultValue: 'Full name' })} placeholder={t('registerPage.fullNamePlaceholder', { defaultValue: 'e.g. Priya Sharma' })} autoComplete="name" required error={errors.fullName?.message} className={inputClass} {...register('fullName')} />
      <Input label={t('registerPage.username', { defaultValue: 'Username' })} placeholder={t('registerPage.usernamePlaceholder', { defaultValue: 'e.g. priya_sharma' })} autoComplete="username" hint={t('registerPage.usernameHint', { defaultValue: '3–50 characters; letters, numbers, dots, dashes or underscores.' })} required error={errors.username?.message} className={inputClass} {...register('username')} />
    </div>
    <Input label={t('registerPage.email', { defaultValue: 'Email' })} type="email" placeholder={t('registerPage.emailPlaceholder', { defaultValue: 'e.g. priya@example.com' })} autoComplete="email" required leftIcon={<Mail />} error={errors.email?.message} className={inputClass} {...register('email')} />
    <div className="grid sm:grid-cols-2 gap-4">
      <div><Input label={t('registerPage.password', { defaultValue: 'Password' })} type="password" placeholder={t('registerPage.passwordPlaceholder', { defaultValue: 'Enter your password' })} autoComplete="new-password" required leftIcon={<Lock />} error={errors.password?.message} className={inputClass} {...register('password')} /><PasswordStrength value={watch('password')} /></div>
      <Input label={t('registerPage.confirmPassword', { defaultValue: 'Confirm password' })} type="password" placeholder={t('registerPage.confirmPasswordPlaceholder', { defaultValue: 'Re-enter the same password' })} autoComplete="new-password" required error={errors.confirmPassword?.message} className={inputClass} {...register('confirmPassword')} />
    </div>
    
    <div>
      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
        {t('registerPage.organisation', { defaultValue: 'Organisation (optional)' })}
      </label>
      <select
        className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
        {...register('organisationId')}
      >
        <option value="">{t('registerPage.selectOrg', { defaultValue: 'Select an organisation (optional)' })}</option>
        {organisations.map(org => (
          <option key={org.id} value={org.id}>
            {org.name}
          </option>
        ))}
      </select>
      <p className="text-[10px] text-slate-400 mt-1">
        {t('registerPage.organisationHint', { defaultValue: 'If chosen, your account requires administrator approval before accessing organization features.' })}
      </p>
    </div>

    <Terms register={register} error={errors.acceptTerms} />
    <Button type="submit" fullWidth size="lg" isLoading={isSubmitting} disabled={isSubmitting}>
      {isSubmitting 
        ? t('registerPage.creating', { defaultValue: 'Creating account…' }) 
        : t('registerPage.createAccount', { defaultValue: 'Create account' })}
    </Button>
  </form>;
}

function OrganisationForm() {
  const { t } = useTranslation();
  const { registerOrganisation } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, watch, setError, formState:{ errors, isSubmitting } } = useForm({
    resolver:zodResolver(organisationRegisterSchema), defaultValues:{ acceptTerms:false, organisationType:'' },
  });
  const submit = async (data) => {
    try {
      const { confirmPassword: _confirmPassword, acceptTerms: _acceptTerms, ...payload } = data;
      await registerOrganisation(payload);
      toast.success('Your organisation account has been created successfully.');
      navigate('/', { replace:true });
    } catch(error) { setError('root', { message:extractErrorMessage(error) }); }
  };
  const field = (name,label,required=false,type='text',placeholder='',hint='') =>
    <Input label={label} type={type} placeholder={placeholder} hint={hint} required={required} error={errors[name]?.message} className={inputClass} {...register(name)} />;
  return <form onSubmit={handleSubmit(submit)} className="space-y-6" noValidate>
    {errors.root && <Alert variant="error">{errors.root.message}</Alert>}
    <section>
      <h2 className="text-xl font-bold">{t('registerPage.orgTitle', { defaultValue: 'Organisation Registration' })}</h2>
      <p className="mt-1 mb-4 text-sm text-[#9FAFA5]">{t('registerPage.orgSubtitle', { defaultValue: 'Register your company or institution to start your sustainability journey.' })}</p>
      <div className="grid sm:grid-cols-2 gap-4">
        {field('organisationName', t('registerPage.orgName', { defaultValue: 'Organisation Name' }), true, 'text', t('registerPage.orgNamePlaceholder', { defaultValue: 'e.g. GreenTech Solutions' }))}
        {field('organisationCode', 'Organisation code', true, 'text', 'e.g. GFT-2026', 'Use your company or institution code.')}
        <div><label className="form-label">Organisation type *</label><select className={`form-input ${inputClass}`} {...register('organisationType')}><option value="">Choose organisation type</option><option>Company</option><option>Institution</option><option>Non-profit</option><option>Government</option><option>Team</option></select>{errors.organisationType && <p className="form-error">{errors.organisationType.message}</p>}</div>
        {field('industry','Industry',false,'text','e.g. Information Technology')}
        {field('officialEmail', t('registerPage.orgEmail', { defaultValue: 'Official Email' }), true, 'email', t('registerPage.orgEmailPlaceholder', { defaultValue: 'e.g. admin@greentech.in' }))}
        {field('contactNumber','Contact number',false,'tel','e.g. +91 98765 43210')}
        <div className="sm:col-span-2">{field('address','Address',false,'text','e.g. 12, Anna Salai, Guindy')}</div>
        {field('city','City',false,'text','e.g. Chennai')}
        {field('state','State',false,'text','e.g. Tamil Nadu')}
        {field('country','Country',false,'text','e.g. India')}
      </div>
    </section>
    <section>
      <h2 className="text-xl font-bold">2. {t('orgDashboard.adminProfile')}</h2>
      <p className="mt-1 mb-4 text-sm text-[#9FAFA5]">This person will manage the organisation dashboard and members.</p>
      <div className="grid sm:grid-cols-2 gap-4">
        {field('adminFullName', t('registerPage.fullName', { defaultValue: 'Admin full name' }), true, 'text', 'e.g. Priya Sharma')}
        {field('username', t('registerPage.username', { defaultValue: 'Username' }), true, 'text', 'e.g. priya.admin', t('registerPage.usernameHint', { defaultValue: '3–50 characters; letters, numbers, dots, dashes or underscores.' }))}
        {field('workEmail', 'Work email', true, 'email', 'e.g. priya@greenfield.com')}
        {field('jobTitle', 'Job title', false, 'text', 'e.g. Sustainability Manager')}
        <div>{field('password', t('registerPage.orgPassword', { defaultValue: 'Admin Password' }), true, 'password', t('registerPage.orgPasswordPlaceholder', { defaultValue: 'Create a strong password' }))}<PasswordStrength value={watch('password')} /></div>
        {field('confirmPassword', t('registerPage.confirmOrgPassword', { defaultValue: 'Confirm Password' }), true, 'password', t('registerPage.confirmPasswordPlaceholder', { defaultValue: 'Re-enter the same password' }))}
      </div>
    </section>
    <Terms register={register} error={errors.acceptTerms} />
    <Button type="submit" fullWidth size="lg" isLoading={isSubmitting} disabled={isSubmitting}>
      {isSubmitting 
        ? t('registerPage.registeringOrg', { defaultValue: 'Registering…' }) 
        : t('registerPage.registerOrg', { defaultValue: 'Register Organisation' })}
    </Button>
  </form>;
}

export default function RegisterPage() {
  const { t } = useTranslation();
  const [accountType,setAccountType] = useState('INDIVIDUAL');
  const options = [
    { id:'INDIVIDUAL', title: t('registerPage.individualTab', { defaultValue: 'Individual User' }), icon:UserRound, text:'Track your personal carbon footprint, log activities, set sustainability goals, earn badges and receive personalised recommendations.', action:'Continue as Individual' },
    { id:'ORGANISATION', title: t('registerPage.orgTab', { defaultValue: 'Organisation' }), icon:Building2, text:'Register your company, institution or team to monitor organisation emissions, compare employee performance and generate CSR reports.', action:'Continue as Organisation' },
  ];
  return <div className="slide-up rounded-3xl border border-[#1E4432] bg-[#0F2E22]/70 p-5 sm:p-9 text-[#F3EFE4] backdrop-blur-3xl">
    <header className="text-center mb-7"><h1 className="text-3xl font-black">{t('auth.register')}</h1><p className="mt-2 text-[#9FAFA5]">Choose how you want to use CarbonTrack.</p></header>
    <div className="grid md:grid-cols-2 gap-4 mb-8" role="radiogroup" aria-label="Account type">
      {options.map(({id,title,icon:Icon,text,action}) => <button key={id} type="button" role="radio" aria-checked={accountType===id} onClick={()=>setAccountType(id)}
        className={`text-left rounded-2xl border p-5 transition ${accountType===id ? 'border-[#7FBF8C] bg-[#7FBF8C]/10 ring-2 ring-[#7FBF8C]/20' : 'border-[#315744] bg-[#06140F]/35 hover:border-[#7FBF8C]/60'}`}>
        <span className="flex justify-between"><Icon className="h-7 w-7 text-[#7FBF8C]" />{accountType===id && <BadgeCheck className="text-[#7FBF8C]" />}</span>
        <strong className="block text-lg mt-3">{title}</strong><span className="block text-sm text-[#9FAFA5] mt-2">{text}</span><span className="block text-sm font-bold text-[#7FBF8C] mt-4">{action}</span>
      </button>)}
    </div>
    {accountType === 'INDIVIDUAL' ? <IndividualForm key="individual" /> : <OrganisationForm key="organisation" />}
    <p className="text-center mt-7 text-sm"><Link to="/" className="font-bold text-[#7FBF8C]">{t('auth.signIn')}</Link></p>
  </div>;
}
