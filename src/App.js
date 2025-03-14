import React, { useState, useEffect } from 'react';
import { Camera, Save, BarChart2, Settings } from 'lucide-react';

const ExpenseTrackerApp = () => {
  // حالة تخزين البيانات
  const [salary, setSalary] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [newExpense, setNewExpense] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [dailyAverage, setDailyAverage] = useState(0);
  const [remainingSalary, setRemainingSalary] = useState(0);
  const [remainingDays, setRemainingDays] = useState(30); // افتراض شهر 30 يوم
  const [savedAmount, setSavedAmount] = useState(0); // إجمالي المبالغ المدخرة
  const [monthlySavings, setMonthlySavings] = useState([]); // سجل المدخرات الشهرية
  const [savingGoal, setSavingGoal] = useState(''); // هدف الادخار الشهري
  const [dailySpendingLimit, setDailySpendingLimit] = useState(0); // سقف الإنفاق اليومي
  const [totalExpensesPerDay, setTotalExpensesPerDay] = useState(0); // متوسط الإنفاق اليومي الفعلي
  const [isEmergencyExpense, setIsEmergencyExpense] = useState(false); // حالة تحديد المصروف كطارئ
  const [adjustedSpendingLimit, setAdjustedSpendingLimit] = useState(0); // سقف الإنفاق اليومي المعدل بعد النفقات الطارئة
  const [isLoading, setIsLoading] = useState(true); // حالة تحميل البيانات
  const [activeTab, setActiveTab] = useState('expenses'); // التبويب النشط

  // تحميل البيانات من localStorage عند بدء التطبيق
  useEffect(() => {
    const loadData = () => {
      try {
        // تحميل الراتب
        const savedSalary = localStorage.getItem('salary');
        if (savedSalary) setSalary(savedSalary);
        
        // تحميل هدف الادخار
        const savedGoal = localStorage.getItem('savingGoal');
        if (savedGoal) setSavingGoal(savedGoal);
        
        // تحميل المصروفات
        const savedExpenses = localStorage.getItem('expenses');
        if (savedExpenses) setExpenses(JSON.parse(savedExpenses));
        
        // تحميل المدخرات
        const savedSavingAmount = localStorage.getItem('savedAmount');
        if (savedSavingAmount) setSavedAmount(parseFloat(savedSavingAmount));
        
        // تحميل سجل المدخرات
        const savedMonthlySavings = localStorage.getItem('monthlySavings');
        if (savedMonthlySavings) setMonthlySavings(JSON.parse(savedMonthlySavings));
        
        // حساب الأيام المتبقية في الشهر
        const today = new Date();
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        setRemainingDays(lastDayOfMonth - today.getDate() + 1);
      } catch (error) {
        console.error('Error loading data from localStorage:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // حفظ البيانات في localStorage عند تغييرها
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('salary', salary);
      localStorage.setItem('savingGoal', savingGoal);
      localStorage.setItem('expenses', JSON.stringify(expenses));
      localStorage.setItem('savedAmount', savedAmount.toString());
      localStorage.setItem('monthlySavings', JSON.stringify(monthlySavings));
    }
  }, [salary, savingGoal, expenses, savedAmount, monthlySavings, isLoading]);

  // حساب المتوسط اليومي والراتب المتبقي والحد اليومي للإنفاق
  useEffect(() => {
    // حساب إجمالي المصاريف
    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    
    // حساب إجمالي المصاريف الطارئة
    const emergencyExpenses = expenses
      .filter(expense => expense.isEmergency)
      .reduce((acc, curr) => acc + curr.amount, 0);
    
    // حساب متوسط الإنفاق اليومي الفعلي
    const daysSpent = Math.max(30 - remainingDays, 1); // على الأقل يوم واحد لتجنب القسمة على صفر
    setTotalExpensesPerDay(daysSpent > 0 ? (totalExpenses - emergencyExpenses) / daysSpent : 0);
    
    // قيمة الراتب كرقم
    const salaryValue = parseFloat(salary) || 0;
    
    // قيمة هدف الادخار كرقم
    const savingGoalValue = (savingGoal && !isNaN(parseFloat(savingGoal))) ? parseFloat(savingGoal) : 0;
    
    // الراتب المتاح للإنفاق بعد طرح هدف الادخار
    const availableForSpending = salaryValue - savingGoalValue;
    
    // حساب الراتب المتبقي (المتاح للإنفاق بعد طرح المصاريف وهدف الادخار)
    const remaining = availableForSpending - totalExpenses;
    setRemainingSalary(remaining > 0 ? remaining : 0);
    
    // حساب المتوسط اليومي المتاح للإنفاق (بعد مراعاة هدف الادخار)
    const daily = remaining > 0 ? (remaining / remainingDays) : 0;
    setDailyAverage(daily);
    
    // حساب سقف الإنفاق اليومي الأصلي بناءً على هدف الادخار
    const dailyLimit = availableForSpending > 0 ? (availableForSpending / 30) : 0;
    setDailySpendingLimit(dailyLimit);
    
    // حساب سقف الإنفاق اليومي المعدل بعد النفقات الطارئة
    if (remainingDays > 0) {
      const adjustedLimit = (availableForSpending - totalExpenses) / remainingDays;
      setAdjustedSpendingLimit(adjustedLimit > 0 ? adjustedLimit : 0);
    } else {
      setAdjustedSpendingLimit(0);
    }
  }, [expenses, salary, remainingDays, savingGoal]);

  // إضافة مصروف جديد
  const addExpense = () => {
    if (newExpense && newExpenseAmount && !isNaN(parseFloat(newExpenseAmount))) {
      const expense = {
        id: Date.now(),
        title: newExpense,
        amount: parseFloat(newExpenseAmount),
        date: new Date().toLocaleDateString('ar-SA'),
        isEmergency: isEmergencyExpense
      };
      
      setExpenses([...expenses, expense]);
      setNewExpense('');
      setNewExpenseAmount('');
      setIsEmergencyExpense(false);
    }
  };
  
  // حذف مصروف
  const deleteExpense = (id) => {
    setExpenses(expenses.filter(expense => expense.id !== id));
  };

  // إضافة مدخرات
  const addSavings = () => {
    if (remainingSalary > 0) {
      // تحقق مما إذا كان هناك هدف ادخار محدد
      let savedThisMonth = remainingSalary;
      let goalAchieved = false;
      
      if (savingGoal && !isNaN(parseFloat(savingGoal))) {
        goalAchieved = remainingSalary >= parseFloat(savingGoal);
        savedThisMonth = goalAchieved ? parseFloat(savingGoal) : remainingSalary;
      }
      
      // إضافة المتبقي من الشهر إلى المدخرات
      const newSaving = {
        id: Date.now(),
        amount: savedThisMonth,
        goal: savingGoal ? parseFloat(savingGoal) : null,
        goalAchieved: goalAchieved,
        date: new Date().toLocaleDateString('ar-SA'),
        month: new Date().toLocaleString('ar-SA', { month: 'long' })
      };
      
      setMonthlySavings([...monthlySavings, newSaving]);
      setSavedAmount(savedAmount + savedThisMonth);
      
      // إعادة تعيين حالة التطبيق لشهر جديد
      setExpenses([]);
      setRemainingSalary(parseFloat(salary) || 0);
    }
  };

  // رندر التبويب النشط
  const renderActiveTab = () => {
    switch (activeTab) {
      case 'expenses':
        return renderExpensesTab();
      case 'reports':
        return renderReportsTab();
      case 'savings':
        return renderSavingsTab();
      case 'settings':
        return renderSettingsTab();
      default:
        return renderExpensesTab();
    }
  };

  // رندر تبويب النفقات
  const renderExpensesTab = () => {
    return (
      <>
        {/* قسم المؤشرات */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-green-100 p-4 rounded-lg shadow">
            <p className="text-sm mb-1">المتوسط اليومي المتاح</p>
            <p className="text-lg font-bold">{dailyAverage.toFixed(2)} ر.س</p>
            {savingGoal && (
              <p className="text-xs text-gray-600 mt-1">بعد خصم هدف الادخار</p>
            )}
          </div>
          <div className="bg-blue-100 p-4 rounded-lg shadow">
            <p className="text-sm mb-1">المتبقي من الراتب</p>
            <p className="text-lg font-bold">{remainingSalary.toFixed(2)} ر.س</p>
            {savingGoal && (
              <p className="text-xs text-gray-600 mt-1">بعد خصم هدف الادخار</p>
            )}
          </div>
        </div>
        
        {/* معلومات سقف الإنفاق */}
        {savingGoal && !isNaN(parseFloat(savingGoal)) && parseFloat(savingGoal) <= parseFloat(salary) && (
          <div className="bg-white p-4 rounded-lg shadow mb-4">
            <h2 className="font-bold mb-3">معلومات الإنفاق</h2>
            
            {/* سقف الإنفاق الأصلي */}
            <div className="bg-purple-100 p-3 rounded-lg mb-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm mb-1">سقف الإنفاق اليومي</p>
                  <p className="text-lg font-bold">{dailySpendingLimit.toFixed(2)} ر.س</p>
                  <p className="text-xs text-gray-600 mt-1">لتحقيق هدف ادخار {parseFloat(savingGoal).toFixed(2)} ر.س</p>
                </div>
                {parseFloat(totalExpensesPerDay) > parseFloat(dailySpendingLimit) && (
                  <div className="bg-red-100 p-2 rounded-lg">
                    <p className="text-xs text-red-600">تجاوزت سقف الإنفاق بـ {(totalExpensesPerDay - dailySpendingLimit).toFixed(2)} ر.س</p>
                  </div>
                )}
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${parseFloat(totalExpensesPerDay) > parseFloat(dailySpendingLimit) ? 'bg-red-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(100, (totalExpensesPerDay / dailySpendingLimit) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            {/* سقف الإنفاق المعدل */}
            {expenses.some(expense => expense.isEmergency) && (
              <div className="bg-orange-100 p-3 rounded-lg">
                <p className="text-sm font-bold mb-1">سقف الإنفاق المعدل (بعد النفقات الطارئة)</p>
                <div className="flex justify-between items-center">
                  <p className="text-lg font-bold">{adjustedSpendingLimit.toFixed(2)} ر.س <span className="text-xs font-normal">/ يوم</span></p>
                  <div className="text-xs">
                    {adjustedSpendingLimit < dailySpendingLimit ? (
                      <p className="text-orange-600">يجب تقليل الإنفاق في الأيام المتبقية</p>
                    ) : (
                      <p className="text-green-600">لا يزال بإمكانك تحقيق هدف الادخار</p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-1">هذا السقف المعدل للأيام المتبقية ({remainingDays} يوم) لتعويض النفقات الطارئة</p>
              </div>
            )}
          </div>
        )}
        
        {/* قسم إضافة مصروف جديد */}
        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <h2 className="font-bold mb-2">إضافة مصروف جديد</h2>
          <div className="flex mb-2">
            <input
              type="text"
              value={newExpense}
              onChange={(e) => setNewExpense(e.target.value)}
              className="w-2/3 p-2 border rounded-l-lg"
              placeholder="وصف المصروف"
            />
            <input
              type="number"
              value={newExpenseAmount}
              onChange={(e) => setNewExpenseAmount(e.target.value)}
              className="w-1/3 p-2 border-t border-b border-r rounded-r-lg text-left"
              placeholder="المبلغ"
            />
          </div>
          
          {/* خيار تحديد المصروف كطارئ */}
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              id="emergencyExpense"
              checked={isEmergencyExpense}
              onChange={() => setIsEmergencyExpense(!isEmergencyExpense)}
              className="mr-2"
            />
            <label htmlFor="emergencyExpense" className="text-sm">
              هذا مصروف طارئ (لن يؤثر على حساب المتوسط اليومي)
            </label>
          </div>
          
          <button
            onClick={addExpense}
            className="w-full bg-blue-500 text-white p-2 rounded-lg font-bold"
          >
            إضافة
          </button>
        </div>
        
        {/* قائمة المصاريف */}
        <div className="bg-white p-4 rounded-lg shadow flex-grow overflow-auto">
          <h2 className="font-bold mb-2">المصاريف ({expenses.length})</h2>
          {expenses.length === 0 ? (
            <p className="text-gray-500 text-center p-4">لا توجد مصاريف مسجلة بعد</p>
          ) : (
            expenses.map(expense => (
              <div key={expense.id} className="flex justify-between items-center p-2 border-b">
                <div>
                  <div className="flex items-center">
                    <p className="font-bold">{expense.title}</p>
                    {expense.isEmergency && (
                      <span className="mr-2 px-1 py-0.5 bg-orange-100 text-orange-600 text-xs rounded">طارئ</span>
                    )}
                  </div>
                  <p className="text-gray-500 text-sm">{expense.date}</p>
                </div>
                <div className="flex items-center">
                  <p className="font-bold ml-2">{expense.amount.toFixed(2)} ر.س</p>
                  <button
                    onClick={() => deleteExpense(expense.id)}
                    className="text-red-500 p-1"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </>
    );
  };

  // رندر تبويب التقارير
  const renderReportsTab = () => {
    return (
      <div className="bg-white p-4 rounded-lg shadow mb-4 text-center">
        <h2 className="font-bold mb-4">التقارير والتحليلات</h2>
        <p className="text-gray-500">تقارير مفصلة عن أنماط الإنفاق الخاصة بك ستكون متاحة قريباً.</p>
        <div className="py-8">
          <BarChart2 size={64} className="mx-auto text-blue-500 opacity-50" />
        </div>
      </div>
    );
  };

  // رندر تبويب المدخرات
  const renderSavingsTab = () => {
    return (
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <h2 className="font-bold mb-2">المدخرات</h2>
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-sm">إجمالي المدخرات</p>
            <p className="text-lg font-bold text-green-600">{savedAmount.toFixed(2)} ر.س</p>
          </div>
          <button
            onClick={addSavings}
            className="bg-green-500 text-white px-4 py-2 rounded-lg font-bold"
          >
            حفظ المتبقي كمدخرات
          </button>
        </div>
        
        {/* عرض سجل المدخرات الشهرية */}
        {monthlySavings.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-bold mb-2">سجل المدخرات الشهرية</h3>
            <div className="max-h-64 overflow-auto">
              {monthlySavings.map((saving) => (
                <div key={saving.id} className="flex justify-between items-center p-2 border-b">
                  <div>
                    <p className="text-sm">{saving.month}</p>
                    <p className="text-xs text-gray-500">{saving.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-600 font-bold">{saving.amount.toFixed(2)} ر.س</p>
                    {saving.goal && (
                      <p className={`text-xs ${saving.goalAchieved ? 'text-green-500' : 'text-orange-500'}`}>
                        {saving.goalAchieved ? '✓ تم تحقيق الهدف' : `${((saving.amount / saving.goal) * 100).toFixed(0)}% من الهدف`}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // رندر تبويب الإعدادات
  const renderSettingsTab = () => {
    return (
      <>
        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <h2 className="font-bold mb-4">الإعدادات</h2>
          
          <div className="mb-4">
            <label className="block mb-2 font-bold">الراتب الشهري</label>
            <div className="flex">
              <input
                type="number"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                className="w-full p-2 border rounded-lg text-left"
                placeholder="أدخل الراتب"
              />
              <span className="p-2 font-bold">ر.س</span>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block mb-2 font-bold">هدف الادخار الشهري</label>
            <div className="flex">
              <input
                type="number"
                value={savingGoal}
                onChange={(e) => setSavingGoal(e.target.value)}
                className="w-full p-2 border rounded-lg text-left"
                placeholder="المبلغ المراد ادخاره"
              />
              <span className="p-2 font-bold">ر.س</span>
            </div>
            {parseFloat(savingGoal) > parseFloat(salary) && (
              <p className="text-red-500 text-sm mt-1">هدف الادخار أكبر من الراتب!</p>
            )}
          </div>
          
          <div className="mb-4">
            <button
              className="w-full bg-red-500 text-white p-2 rounded-lg font-bold"
              onClick={() => {
                const confirmDelete = window.confirm('هل أنت متأكد من رغبتك في حذف جميع البيانات؟ لا يمكن التراجع عن هذا الإجراء.');
                if (confirmDelete) {
                  localStorage.clear();
                  window.location.reload();
                }
              }}
            >
              حذف جميع البيانات
            </button>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <h2 className="font-bold mb-2">عن التطبيق</h2>
          <p className="text-sm text-gray-700 mb-2">
            تطبيق إدارة النفقات اليومية يساعدك على تتبع مصاريفك وتحقيق أهدافك المالية بطريقة سهلة وفعالة.
          </p>
          <p className="text-xs text-gray-500">الإصدار 1.0.0</p>
        </div>
      </>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 p-4 rtl" dir="rtl">
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-xl font-bold">جاري تحميل البيانات...</p>
        </div>
      ) : (
        <>
          {/* رأس التطبيق */}
          <div className="bg-blue-500 p-4 rounded-lg shadow-lg mb-4">
            <h1 className="text-white text-xl font-bold text-center">إدارة النفقات اليومية</h1>
            <p className="text-white text-center text-sm mt-1">الأيام المتبقية في الشهر: {remainingDays}</p>
          </div>
          
          {/* محتوى التبويب النشط */}
          <div className="flex-grow overflow-auto mb-4">
            {renderActiveTab()}
          </div>
          
          {/* شريط التبويبات */}
          <div className="bg-white p-2 rounded-lg shadow flex justify-around">
            <button 
              className={`p-2 flex flex-col items-center ${activeTab === 'expenses' ? 'text-blue-500' : 'text-gray-500'}`}
              onClick={() => setActiveTab('expenses')}
            >
              <Camera size={20} />
              <span className="text-xs mt-1">النفقات</span>
            </button>
            <button 
              className={`p-2 flex flex-col items-center ${activeTab === 'reports' ? 'text-blue-500' : 'text-gray-500'}`}
              onClick={() => setActiveTab('reports')}
            >
              <BarChart2 size={20} />
              <span className="text-xs mt-1">التقارير</span>
            </button>
            <button 
              className={`p-2 flex flex-col items-center ${activeTab === 'savings' ? 'text-blue-500' : 'text-gray-500'}`}
              onClick={() => setActiveTab('savings')}
            >
              <Save size={20} />
              <span className="text-xs mt-1">المدخرات</span>
            </button>
            <button 
              className={`p-2 flex flex-col items-center ${activeTab === 'settings' ? 'text-blue-500' : 'text-gray-500'}`}
              onClick={() => setActiveTab('settings')}
            >
              <Settings size={20} />
              <span className="text-xs mt-1">الإعدادات</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ExpenseTrackerApp;