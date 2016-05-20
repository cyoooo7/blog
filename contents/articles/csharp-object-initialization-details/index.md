---
title: C#在类型实例化时都干了什么
author: Roy Cheng
date: 2011-05-27 07:37
template: article.jade
---

前一阵子我参加了一次笔试，其中有一道选择题让我印象深刻，是这样的：

> #### 实例化一个X类型对象时所执行的顺序：
<br/>
> A. 调用X类型构造函数，调用X类型基类的构造函数，调用X类型内部字段的构造函数
<br/>
> B. 调用X类型内部字段的构造函数，调用X类型基类的构造函数，调用X类型构造函数
<br/>
> C. 调用X类型基类的构造函数，调用X类型构造函数，调用X类型内部字段的构造函数
<br/>
> D. 调用X类型基类的构造函数，调用X类型内部字段的构造函数，调用X类型构造函数

<span class="more"></span>

在我看来，这道题出得很没水平。在C++的世界里，我会毫不犹豫的选D。但是，由于C#引入了字段初始化器，所以选什么答案完全依赖于类具体是如何设计的。好吧，我们今天就来谈谈C#在类型实例化时都有哪些步骤。

首先我们都知道，对于引用类型对象，在执行构造函数之前，我们需要使用关键字new来为新实例分配内存。new可以根据对象的类型来为其在堆上分配足够的空间，并且将这个对象的所有字段都设为默认值。也就是说，CLR会把该对象的所有引用类型字段设为null，而把值类型字段的所有底层二进制表示位设为0（本质上来说，不论是将值类型或引用类型字段初始化为“默认值”，其实都是把他们底层的数据位设为0）。这是任何引用类型对象实例化的第一步。

我们暂且先不考虑对象有指定基类的情况，先看看下面的代码吧：

``` C++
class MyClass
{ 
   static MyClass() 
   { 
      Console.WriteLine("静态构造函数被调用。"); 
   }
   private static Component staticField = new Component("静态字段被实例化。");
   private Component instanceField = new Component("实例成员字段被实例化。");
   public MyClass() 
   { 
      Console.WriteLine("对象构造函数被调用。"); 
   }
}

// 此类型在实例化的时候可以在控制台输出自定义信息，以给出相关提示
class Component
{ 
   public Component(String info) 
   { 
      Console.WriteLine(info); 
   }
}


class Program
{
   staticvoid Main(string[] args)
   {
      MyClass instance =new MyClass();
   }
} 
```

很显然，静态构造函数和静态字段的构造函数会首先被调用。因为CLR在使用任何类型实例之前一定会先加载该类型，也就需要调用静态构造函数并且初始化静态成员。但是，到底是先初始化静态成员呢，还是调用静态构造函数呢？答案是初始化静态成员，因为CLR必须保证在执行构造函数的方法体时，相关的成员变量应该都可以被安全地使用。同样的道理也适用于实例构造函数和字段，也就是说对象成员的实例化会先于成员构造函数被执行。以下是实例化MyClass对象时控制台的输出：

```
静态字段被实例化。
静态构造函数被调用。
实例成员字段被实例化。
对象构造函数被调用。
```

接下来，我们看看如果对象有指定的基类的情况：

``` C++
class Base
{
   static Base()
   {
      Console.WriteLine("基类静态构造函数被调用。");
   }
 
   private static Component baseStaticField = new Component("基类静态字段被实例化。");
   private Component baseInstanceField = new Component("基类实例成员字段被实例化。");

   public Base()
   {
      Console.WriteLine("基类构造函数被调用。");
   }
}

//此类型用作派生类，同基类一样，它也包含静态构造函数，以及静态字段、实例成员字段各一个。
class Derived : Base
{
   static Derived()
   {
      Console.WriteLine("派生类静态构造函数被调用。");
   }

   private static Component derivedStaticField = new Component("派生类静态字段被实例化。");
   private Component derivedInstanceField = new Component("派生类实例成员字段被实例化。");

   public Derived()
  {
      Console.WriteLine("派生类构造函数被调用。");
  }  
}

//此类型用于作为Base类和Derived类的成员
//此类型在实例化的时候可以在控制台输出自定义信息，以给出相关提示
class Component
{
   public Component(String info)
   {
      Console.WriteLine(info);
   }
}

//在主程序里实例化了一个子类对象
class Program
{
   staticvoid Main(string[] args)
   {
      Derived derivedObject = new Derived();
   }
}
```

类似于上个例子里的MyClass，这里的子类Derived和基类Base都有静态构造函数，也包含静态和实例成员各一个。当实例化一个子类Derived对象的实例时，输出的结果可能并不容易想到：

```
派生类静态字段被实例化。
派生类静态构造函数被调用。
派生类实例成员字段被实例化。
基类静态字段被实例化。
基类静态构造函数被调用。
基类实例成员字段被实例化。
基类构造函数被调用。
派生类构造函数被调用。
```
从结果我们可以看出，派生类的静态字段初始化，静态构造函数调用，实例成员字段初始化都会先于基类的任何初始化动作被执行。对于派生类静态部分先被构造这一点比较容易理解，因为毕竟在CLR装载派生类Derived之前，基类Base还未被使用过，也就不会先被装载。

但是，为什么派生类的实例成员字段会在基类被构造之前初始化呢？答案和虚函数有关。试想有这么一个基类，它在构造函数中调用了一个虚方法。然后又有这么一个派生类，它重写了基类的那个虚方法，并且在这个虚方法中访问了它自己的一个实例成员字段。这一切都是完全合法的（至少在C#的世界里是这样的），对吧？在实例化一个派生类对象的过程中，其基类的构造函数会被调用，接着那个虚方法也会被调用，再接着派生类的实例成员字段会被访问。所以此时此刻，这个类的实例成员字段必须是已被准备好了的！因此，派生类的实例成员字段必须先于基类部分被构造。

好了，再回到我们的例子。从“基类静态字段被实例化。”开始，剩下的部分很容易理解：基类按照我们预想的方式被生成，然后派生类的构造函数被调用。至此，一个派生类的对象就被实例化了。

顺便说一句，关于类字段初始化器，或对象字段初始化器，他们初始化成员字段的顺序是成员在类定义中出现的先后顺序。再顺便说一句，如果你程序的逻辑依赖于成员在类定义中出现的顺序，这往往预示着潜在的问题——这种代码会非常脆弱。

现在当我们再回过头看文章开头的题目时，一切都明朗了——根本就没有一个正确答案！因为如果X类型有对象字段初始化器，且其构造函数内没有初始化任何实例字段的话，答案应该选B。如果X类型没有对象字段初始化器，且其构造函数内初始化了实例字段的话，答案选C。如果X类型没有对象字段初始化器，且其构造函数内没有初始化任何实例字段的话，答案选D。再其他的情况，则没有答案可选了。