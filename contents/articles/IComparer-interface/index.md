---
title: 快速实现IComparer接口
author: Roy Cheng
date: 2011-07-21 08:03
template: article.jade
---

`SortedList<T>`，`SortedSet<T>`与`SortedDictionary<T>`都是我们常用的泛型类型。当T是自定义类型时，往往该类型的默认比较行为不是我们所期望的。
例如，我们有如下（很老土的）Employee类：

``` C++
class Employee
{
    publicint Id { get; set; }
    public String Name { get; set; }
    publicint Age { get; set; }
}
```

<span class="more"></span>

如果我们想让Employee类型按照Name字段升序排序，一般有两种做法。一种是让Employee实现`IComparable`或者`IComparable<Employee>`接口。不过此时如果我们又希望Employee按照别的方式排序的话，那只能另想办法了，因为`IComparable`或`IComparable<Employee>`接口所要求的Compare方法在Employee中只能有一个实现。另一种做法是构造一个比较器来指定Employee的比较规则。其中，比较器需要实现`IComparer`或`Comparer<Employee>`接口。
在这个例子中，实现的方式可以是这样的：

``` C++ 
//以Employee的Name字段为比较规则的比较器
class EmployeeNameComparer:IComparer<Employee>
{
    publicint Compare(Employee x, Employee y)
    {
        return StringComparer.CurrentCulture.Compare(x.Name, y.Name);
    }
}
```
我们构造了一个`EmployeeNameComparer`类型，当我们这样使用`SortedList<Employee>`的时候：

``` C++
// 记录Employee电话号码的数据结构(虽然这么做有点傻，不过为了举例子还是将就一下吧)

var empTelTable = new SortedDictionary<Employee, String>(new EmployeeNameComparer());
``` 

这个比较器类型可以指示`SortedList`——我们希望它以何种方式比较两个Employee对象。

然而，当我们想让Employee按照Id或Age排序的时候，类似地，我们又会需要一个`EmployeeAgeComparer`和一个`EmployeeAgeComparer`：

``` C++
// 以Employee的Age字段为比较规则的比较器
class EmployeeAgeComparer:IComparer<Employee>
{
    publicint Compare(Employee x, Employee y)
    {
        return x.Age - y.Age;
    }
}

// 以Employee的Id字段为比较规则的比较器
class EmployeeIdComparer:IComparer<Employee>
{
    publicint Compare(Employee x, Employee y)
    {
        return x.Id - y.Id;
    }
}

``` 

`EmployeeAgeComparer`与`EmployeeIdComparer`的代码几乎一样。作为DRY（Don‘t Repeart Yourself）原则的忠实维护者，我们是不希望这样几乎一模一样的两份代码出现在我们的项目中的。因此，是时候想办法重构了。

上面所实现的比较器都在编译的时候就已经确定了它们本身的行为，也就是说它比较两个Employee时所使用的算法在编译时就已经定死了。然而我们真正想要的是一种通用的，能够在运行时指定其行为的比较器。
为了能让同一个比较器能够拥有多种比较的方式，我们需要在运行时将比较的算法传递给它。在比较器的构造函数中向其传递算法，似乎很靠谱。而且在执行构造函数的过程中我们还能够锁定这个算法，以防止在比较器实例化之后，其比较行为还有机会被我们有意或无意地改变。
接下来的问题是如何传递一个表示算法的参数？我们不仅要考虑该参数的有效性，还要考虑它的易用性（我们没有理由为了使用代表某种算法的参数，还需要为它特意构造一种类型吧？那也太麻烦了吧。）。基于这种情况，方法委托自然成了当仁不让的选择！
好了，设计完毕。请看下面的比较器泛型：

``` C++
publicclass DelegatedComparer<T> : IComparer<T>
{
    //在构造函数结束后，_compare就没法改变了。因此DelegatedComparer<T>实例的行为也就可以被锁定了。
    private readonly Func<T, T, int> _compare;
    
    //传入一个委托，表示比较算法。
    public DelegatedComparer(Func<T, T, int> func)
    {
        _compare = func;
    }

    publicint Compare(T x, T y)
    {
        //直接调用委托。
        return _compare(x, y);
    }
}
```

这个`DelegatedComparer<T>`泛型类型实现了`IComparer<T>`，其构造函数接受一个`Func<T, T, int>`类型的委托为参数。这个委托可以用来指定比较器的比较算法。一切就是这么简单！

我们可以这样使用它：

``` C++
//记录Employee电话号码的数据结构(虽然这么做有点傻，不过为了举例子还是将就一下吧)
        var empTelTable =new SortedDictionary<Employee, String>(
        new DelegatedComparer<Employee>(
            (x, y) => x.Id - y.Id)
        );
```
使用起来也非常简单！打字都少了很多吧？ :-)

你可能已经看出来了，这不就是Strategy模式吗？你说对了，我们就是利用了Strategy模式可以在运行时改变对象行为的能力，来完成动态指定比较算法的工作的。
有了`DelegatedComparer<T>`，我们就可以轻松完成Employee对象之间的比较工作了。由于`DelegatedComparer<T>`是个泛型，所以我们甚至不需要把目光局限在（老土的）Employee身上，我们还可以对Customer类型，Student类型（都同样的老土）使用我们的`DelegatedComparer<T>`比较器。从此我们再也不需要为了某一种比较算法而专门实现一个类型了！
